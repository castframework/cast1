import { getLogger, Logger } from '../../utils/logger';
import {
  Ledger,
  InstrumentDetails,
  OracleSettlementTransaction,
  SettlementTransactionParticipantAddresses,
  SettlementTransactionStatus,
  STRSettlementTransaction,
} from '@castframework/models';
import { Injectable } from '@nestjs/common/';

import {
  SETTLEMENT_TRANSACTION_STATUS_CANCELED,
  SETTLEMENT_TRANSACTION_STATUS_CASH_RECEIVED,
  SETTLEMENT_TRANSACTION_STATUS_CASH_SENT,
  SETTLEMENT_TRANSACTION_STATUS_CREATED,
  SETTLEMENT_TRANSACTION_STATUS_ERROR,
  SETTLEMENT_TRANSACTION_STATUS_NOT_CREATED,
  SETTLEMENT_TRANSACTION_STATUS_TOKEN_LOCKED,
} from '../../constants/settlementTransactionStatus';
import { StrClientService } from '@castframework/oracle-clients';
import { collapseToBigNumber, uuidToFixed } from '../../utils/bigNumberUtils';
import { validateLedgerContractAddress } from '../../utils/blockchainUtils';

import {
  BlockchainService,
  DriverOf,
} from '../../shared/services/blockchain.service';
import {
  BlockchainSpecificParamsOf,
  BlockchainSpecificTransactionInfoOf,
  CancelReceipt,
  TransactionInfo,
  TransactionReceipt,
} from '@castframework/transaction-manager';
import { EthereumSpecificParams } from '@castframework/blockchain-driver-eth';
import { TezosSpecificParams } from '@castframework/blockchain-driver-tz';

@Injectable()
export class FxoSettlementInfoService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly strClientService: StrClientService,
  ) {}

  public async getParticipantAccountNumbersForSettlementTransaction(
    settlementTransactionId: string,
  ): Promise<SettlementTransactionParticipantAddresses> {
    // TODO: Look into blockchain instead of str to get all participants
    let str: STRSettlementTransaction | null;
    try {
      str = await this.strClientService.getSettlementTransaction(
        settlementTransactionId,
      );
    } catch (e) {
      this.logger.warn(
        `Error while getting settlement transaction details for id[${settlementTransactionId}]`,
      );
      return {
        securityDeliverer: 'undefined',
        securityReceiver: 'undefined',
        securityIssuer: 'undefined',
        settler: 'undefined',
        registrar: 'undefined',
      };
    }

    if (!str) {
      // Transaction does not exist or we don't have rights to see it
      return {
        securityDeliverer: 'undefined',
        securityReceiver: 'undefined',
        securityIssuer: 'undefined',
        settler: 'undefined',
        registrar: 'undefined',
      };
    }

    const {
      deliverySenderAccountNumber,
      deliveryReceiverAccountNumber,
      instrumentPublicAddress,
      instrumentLedger,
    } = str;

    const instrumentContract = await this.blockchainService.getForgeBond(
      instrumentLedger,
      instrumentPublicAddress,
    );

    const securityIssuer = await instrumentContract.owner();
    const settler = await instrumentContract.settler();
    const registrar = await instrumentContract.registrar();

    return {
      securityDeliverer: deliverySenderAccountNumber,
      securityReceiver: deliveryReceiverAccountNumber,
      securityIssuer: securityIssuer,
      settler: settler,
      registrar: registrar,
    };
  }

  public async getSettlementTransactions(
    instrumentLedger?: Ledger,
    instrumentAddress?: string,
  ): Promise<OracleSettlementTransaction[]> {
    const ledgersToQuery = instrumentLedger
      ? [instrumentLedger]
      : this.blockchainService.supportedLedgers;

    const settlementTransactions =
      await this.strClientService.getSettlementTransactions(
        ledgersToQuery,
        instrumentAddress,
      );

    return Promise.all(
      settlementTransactions.map(async (st) => ({
        ...st,
        settlementStatus: await this.getSettlementTransactionStatus(st),
      })),
    );
  }

  public async getSettlementTransactionsByPaymentReference(
    paymentReference?: string,
  ): Promise<OracleSettlementTransaction[] | undefined> {
    if (paymentReference === undefined) {
      return undefined;
    }
    const settlementTransactions =
      await this.strClientService.getSettlementTransactionsByPaymentReference(
        paymentReference,
      );

    if (settlementTransactions === null) {
      return undefined;
    }

    return Promise.all(
      settlementTransactions.map(async (st) => ({
        ...st,
        settlementStatus: await this.getSettlementTransactionStatus(st),
      })),
    );
  }

  public async getSettlementTransaction(
    id: string,
  ): Promise<OracleSettlementTransaction | null> {
    const settlementTransaction =
      await this.strClientService.getSettlementTransaction(id);

    if (!settlementTransaction) {
      return null;
    }

    const status = await this.getSettlementTransactionStatus(
      settlementTransaction,
    );
    return {
      ...settlementTransaction,
      settlementStatus: status,
    };
  }

  public async getAllInstruments(ledger: Ledger): Promise<string[] | null> {
    this.logger.debug(`Get all instruments for Ledger ${ledger}`);
    const instrumentRegistry =
      await this.blockchainService.getRegistryFromLedger(ledger, this.logger);
    const contractAddressList: string[] =
      await instrumentRegistry.getAllInstruments();

    return contractAddressList;
  }

  private async getSettlementTransactionStatus(
    st: STRSettlementTransaction,
  ): Promise<SettlementTransactionStatus> {
    const instrument = await this.blockchainService.getForgeBond(
      st.instrumentLedger,
      st.instrumentPublicAddress,
    );

    const fromBlockchain = collapseToBigNumber(
      await instrument.getCurrentState(uuidToFixed(st.id)),
    );

    return this.mapSettlementTransactionStatus(fromBlockchain.toNumber());
  }

  private mapSettlementTransactionStatus(
    blockchainStatus: number,
  ): SettlementTransactionStatus {
    switch (blockchainStatus) {
      case SETTLEMENT_TRANSACTION_STATUS_NOT_CREATED:
        return SettlementTransactionStatus.PENDING;
      case SETTLEMENT_TRANSACTION_STATUS_CREATED:
        return SettlementTransactionStatus.INITIATED;
      case SETTLEMENT_TRANSACTION_STATUS_TOKEN_LOCKED:
        return SettlementTransactionStatus.ACKNOWLEDGED;
      case SETTLEMENT_TRANSACTION_STATUS_CASH_RECEIVED:
        return SettlementTransactionStatus.PROCESSED;
      case SETTLEMENT_TRANSACTION_STATUS_CASH_SENT:
        return SettlementTransactionStatus.SETTLED;
      case SETTLEMENT_TRANSACTION_STATUS_ERROR:
        return SettlementTransactionStatus.REJECTED;
      case SETTLEMENT_TRANSACTION_STATUS_CANCELED:
        return SettlementTransactionStatus.CANCELED;
      default:
        return SettlementTransactionStatus.PENDING;
    }
  }

  public async getInstrumentDetails(
    contractAddress: string,
    instrumentLedger: Ledger,
  ): Promise<InstrumentDetails | null> {
    if (!contractAddress) {
      this.logger.error(`[${instrumentLedger}] contract address is null`);
      return null;
    } else if (
      !validateLedgerContractAddress(contractAddress, instrumentLedger)
    ) {
      this.logger.error(
        `[${instrumentLedger}] Contract address : ${contractAddress} is not a valid address`,
      );
      return null;
    }

    const instrument = await this.blockchainService.getForgeBond(
      instrumentLedger,
      contractAddress,
    );

    const instrumentDetails: InstrumentDetails = {
      issuer: await instrument.owner(),
      registrarAgentAddress: await instrument.registrar(),
      settlerAgentAddress: await instrument.settler(),
      contractAddress: contractAddress,
      initialSupply: (await instrument.initialSupply()) as number,
      isinCode: await instrument.isinCode(),
      name: await instrument.name(),
      symbol: await instrument.symbol(),
      denomination: (await instrument.denomination()) as number,
      divisor: (await instrument.divisor()) as number,
      startDate: (await instrument.startDate()) as number,
      maturityDate: (await instrument.maturityDate()) as number,
      firstCouponDate: (await instrument.firstCouponDate()) as number,
      couponFrequencyInMonths:
        (await instrument.couponFrequencyInMonths()) as number,
      interestRateInBips: (await instrument.interestRateInBips()) as number,
      callable: await instrument.callable(),
      isSoftBullet: await instrument.isSoftBullet(),
      softBulletPeriodInMonths:
        (await instrument.softBulletPeriodInMonths()) as number,
      type: (await instrument.getType()) as string,
    };
    this.logger.debug(
      `[${instrumentLedger}] instrument address ${contractAddress} have details: ${instrumentDetails}`,
    );
    return instrumentDetails;
  }

  public async getTransactionInfo(
    ledger: Ledger,
    transactionId: string,
  ): Promise<
    TransactionInfo<
      BlockchainSpecificTransactionInfoOf<DriverOf<Ledger>>,
      BlockchainSpecificParamsOf<DriverOf<Ledger>>
    >
  > {
    const result = this.blockchainService.getTransactionInfo(
      ledger,
      transactionId,
    );

    return result;
  }

  public async boostTransaction(
    ledger: Ledger,
    transactionId: string,
    blockchainSpecificParams?: EthereumSpecificParams | TezosSpecificParams,
  ): Promise<TransactionReceipt> {
    const result = this.blockchainService.boostTransaction(
      ledger,
      transactionId,
      blockchainSpecificParams,
    );

    return result;
  }

  public async cancelTransaction(
    ledger: Ledger,
    transactionId: string,
    blockchainSpecificParams?: EthereumSpecificParams | TezosSpecificParams,
  ): Promise<CancelReceipt> {
    const result = this.blockchainService.cancelTransaction(
      ledger,
      transactionId,
      blockchainSpecificParams,
    );

    return result;
  }
}
