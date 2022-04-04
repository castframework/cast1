import { getLogger, Logger } from '../../utils/logger';
import {
  CreateMovementInput,
  CreateOracleSettlementTransactionInput,
  Currency,
  InstrumentPosition,
  SettlementModel,
  STRSettlementTransaction,
  InitiateRedemptionInput,
  ParticipantAdresses,
} from '@castframework/models';
import { BadRequestException, Injectable } from '@nestjs/common/';
import { PositionService } from '../fxo/position/position.service';
import { StrClientService } from '@castframework/oracle-clients';
import { errorAsString } from '../../utils/errorAsString';
import {
  generateCashMovementInput,
  generateSettlementTransactionInput,
  generateTokenMovementInput,
} from './fro.helper';
import { uuidToFixed } from '../../utils/bigNumberUtils';
import * as UUID from 'uuid';
import { InstrumentState } from '../../constants/instrumentState';
import { BlockchainService } from '../../shared/services/blockchain.service';
import { ForgeBond } from '@castframework/cast-interface-v1';
import { BlockchainDriver } from '@castframework/transaction-manager';

@Injectable()
export class FroRedemptionService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly positionService: PositionService,
    private readonly strClientService: StrClientService,
  ) {}

  public async initiateRedemption(
    input: InitiateRedemptionInput,
  ): Promise<string> {
    const logger = getLogger(this.constructor.name, 'initiateRedemption');

    const instrumentContract = await this.blockchainService.getForgeBond(
      input.instrumentLedger,
      input.instrumentAddress,
    );

    const instrumentState = await instrumentContract.state();
    if (Number(instrumentState) === InstrumentState.REDEEMED) {
      const errorMessage = `Instrument with instrumentAddress[${input.instrumentAddress}] instrumentLedger[${input.instrumentLedger}] is already fully redeemed.`;
      this.logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    const positions = await this.positionService.getInstrumentPositions(
      input.instrumentAddress,
      input.instrumentLedger,
    );

    let settlementTransactionsInputs: CreateOracleSettlementTransactionInput[];

    try {
      settlementTransactionsInputs =
        await this.generateSettlementTransactionsInputs(
          instrumentContract,
          input,
          positions,
        );
    } catch (error) {
      const errorMessage = `Could not generate settlement transactions. Error[${errorAsString(
        error,
      )}]`;
      this.logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    if (settlementTransactionsInputs.length === 0) {
      const errorMessage = `Nothing to redeem for instrumentAddress[${input.instrumentAddress}] instrumentLedger[${input.instrumentLedger}]`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    this.logger.debug(
      `Generated settlement transactions inputs: ${JSON.stringify(
        settlementTransactionsInputs,
      )}`,
    );

    let settlementTransactions: STRSettlementTransaction[];

    try {
      if (!UUID.validate(input.operationId)) {
        throw new Error(
          `operationId is not a valid uuid : ${input.operationId}`,
        );
      }
      settlementTransactions =
        await this.strClientService.createSettlementTransactions(
          settlementTransactionsInputs,
        );
    } catch (error) {
      const errorMessage = `Could not save redemption into STR. Error[${errorAsString(
        error,
      )}]`;
      this.logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    settlementTransactions.forEach((settlementTransaction) => {
      logger.info(
        `Settlement transaction ${settlementTransaction.id} (hash: ${settlementTransaction.hash}) created for instrument at ${input.instrumentAddress}`,
      );
      logger.debug(
        `Settlement transaction ${settlementTransaction.id} (hash: ${settlementTransaction.hash}) created for instrument at ${input.instrumentAddress}`,
        JSON.stringify(settlementTransaction),
      );
    });

    const blockchainInput = settlementTransactions.map((str) => ({
      txId: uuidToFixed(str.id),
      operationId: uuidToFixed(str.operationId),
      deliverySenderAccountNumber: str.deliverySenderAccountNumber,
      deliveryReceiverAccountNumber: str.deliveryReceiverAccountNumber,
      deliveryQuantity: str.deliveryQuantity,
      txHash: str.hash,
    }));

    this.logger.debug(
      `Calling blockchain initiateRedemption endpoint with params: ${JSON.stringify(
        blockchainInput,
      )}`,
    );

    logger.info(
      `Initiate redemption for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger}`,
    );
    const { transactionId } = await instrumentContract.initiateRedemption(
      blockchainInput,
    );

    return transactionId;
  }

  private async generateSettlementTransactionsInputs(
    instrumentContract: ForgeBond<BlockchainDriver<unknown, unknown>>,
    {
      settlementDate,
      operationId,
      instrumentAddress,
      instrumentLedger,
      issuerAddresses: issuerAddressesWithoutDelivery,
      participantsAddresses,
      tradeDate,
      tradeId,
      settlementModel,
      holdableTokenAddress,
      intermediateAccountIBAN,
    }: InitiateRedemptionInput,
    positions: InstrumentPosition[],
    additionalReaderAddresses?: string[],
  ): Promise<CreateOracleSettlementTransactionInput[]> {
    const settlementTransactions: CreateOracleSettlementTransactionInput[] = [];

    const instrumentDenomination = Number(
      await instrumentContract.denomination(),
    );

    const instrumentCurrencyString = await instrumentContract.currency();
    const instrumentCurrency = Currency[instrumentCurrencyString];

    const issuerAddresses: ParticipantAdresses = {
      deliveryAccountNumber: await instrumentContract.owner(),
      ...issuerAddressesWithoutDelivery,
    };

    // We guess investors are all participants except issuer and settler.
    const investorsPosition = positions.filter(
      (pos) =>
        pos.legalEntityAddress.toLowerCase() !==
        issuerAddresses.deliveryAccountNumber.toLowerCase(),
    );

    let issuerToSettlerCashMovementInput: CreateMovementInput;
    if (settlementModel === SettlementModel.INDIRECT) {
      if (typeof intermediateAccountIBAN !== 'string') {
        throw new BadRequestException(
          'Indirect settlement transaction must have an intermediateAccountIBAN',
        );
      }
      issuerToSettlerCashMovementInput = generateCashMovementInput(
        issuerAddresses,
        { paymentAccountNumber: intermediateAccountIBAN },
        operationId,
      );
    }

    investorsPosition
      .filter((position) => position.balance > 0)
      .forEach((position) => {
        const investorAddresses = this.getParticipantAddressesOrThrow(
          position.legalEntityAddress,
          participantsAddresses,
        );

        const cashMovements: CreateMovementInput[] = [];

        if (settlementModel === SettlementModel.DIRECT) {
          if (typeof holdableTokenAddress !== 'string') {
            throw new BadRequestException(
              'Direct settlement transaction must have an intermediateAccountIBAN',
            );
          }
          const issuerToInvestorCashMovementInput = generateCashMovementInput(
            issuerAddresses,
            investorAddresses,
            operationId,
          );

          cashMovements.push(issuerToInvestorCashMovementInput);
        } else {
          if (typeof intermediateAccountIBAN !== 'string') {
            throw new BadRequestException(
              'Indirect settlement transaction must have an intermediateAccountIBAN',
            );
          }
          const settlerToInvestorCashMovementInput = generateCashMovementInput(
            { paymentAccountNumber: intermediateAccountIBAN },
            investorAddresses,
            operationId,
          );

          cashMovements.push(issuerToSettlerCashMovementInput);
          cashMovements.push(settlerToInvestorCashMovementInput);
        }

        const tokenMovement = generateTokenMovementInput(
          issuerAddresses,
          investorAddresses,
        );

        const settlementTransaction = generateSettlementTransactionInput(
          position.balance,
          position.balance * instrumentDenomination,
          instrumentCurrency,
          settlementDate,
          operationId,
          instrumentAddress,
          instrumentLedger,
          issuerAddresses,
          investorAddresses,
          [...cashMovements, tokenMovement],
          additionalReaderAddresses || [],
          tradeId,
          tradeDate,
          settlementModel,
          holdableTokenAddress,
          intermediateAccountIBAN,
        );

        settlementTransactions.push(settlementTransaction);
      });

    return settlementTransactions;
  }

  private getParticipantAddressesOrThrow(
    deliveryAddress: string,
    participantsAddresses: ParticipantAdresses[],
  ): ParticipantAdresses {
    const addresses = participantsAddresses.find(
      (pa) =>
        pa.deliveryAccountNumber.toLowerCase() ===
        deliveryAddress.toLowerCase(),
    );

    if (!addresses) {
      throw new Error(
        `Cannot find payment account number for address ${deliveryAddress}.`,
      );
    }

    return addresses;
  }
}
