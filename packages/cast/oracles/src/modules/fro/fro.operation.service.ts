import { getLogger, Logger } from '../../utils/logger';
import {
  CancelSettlementTransactionInput,
  CreateMovementInput,
  CreateOracleSettlementTransactionInput,
  ForgeOperationType,
  InitiateSubscriptionInput,
  InitiateTradeInput,
  Ledger,
  ParticipantAdresses,
  SettlementModel,
  STRSettlementTransaction,
} from '@castframework/models';
import { Injectable, BadRequestException } from '@nestjs/common/';
import { StrClientService } from '@castframework/oracle-clients';
import { errorAsString } from '../../utils/errorAsString';

import {
  generateCashMovementInput,
  generateSettlementTransactionInput,
  generateTokenMovementInput,
} from './fro.helper';

import { uuidToFixed } from '../../utils/bigNumberUtils';
import * as UUID from 'uuid';
import { BlockchainService } from '../../shared/services/blockchain.service';
import { ForgeBond } from '@castframework/cast-interface-v1';
import { contractNotification } from '@castframework/oracle-clients/src/modules/fioClient/generated/graphql';

@Injectable()
export class FroOperationService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly strClientService: StrClientService,
  ) {}

  public async initiateOperation(
    input: InitiateTradeInput | InitiateSubscriptionInput,
    forgeOperationType: ForgeOperationType,
  ): Promise<string> {
    const logger = getLogger(this.constructor.name, 'initiateOperation');
    logger.debug(
      `Initiate Operation [${forgeOperationType}] with input: ${JSON.stringify(
        input,
      )}`,
    );
    if (
      forgeOperationType !== ForgeOperationType.TRADE &&
      forgeOperationType !== ForgeOperationType.SUBSCRIPTION
    ) {
      const errorMessage = `forgeOperationType is not a valid operation type : ${forgeOperationType}`;
      logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    // To remove when initiateTrade will be implemented on tezos blockchain
    if (
      forgeOperationType === ForgeOperationType.TRADE &&
      input.instrumentLedger === Ledger.TEZOS
    ) {
      const errorMessage = `Initiate Trade on Tezos Blockchain is not implemented yet`;
      logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    const instrumentContract = await this.blockchainService.getForgeBond(
      input.instrumentLedger,
      input.instrumentAddress,
    );

    let settlementTransactionInput: CreateOracleSettlementTransactionInput;

    try {
      if (!UUID.validate(input.operationId)) {
        throw new BadRequestException(
          `operationId is not a valid uuid : ${input.operationId}`,
        );
      }
      const issuerDeliveryAccountNumber = await instrumentContract.owner();
      settlementTransactionInput =
        forgeOperationType === ForgeOperationType.TRADE
          ? await this.generateSettlementTransactionsInputTrade(
              input as InitiateTradeInput,
            )
          : await this.generateSettlementTransactionsInputSubscription(
              issuerDeliveryAccountNumber,
              input as InitiateSubscriptionInput,
            );
    } catch (error) {
      const errorMessage = `Could generate settlement transactions. Error[${errorAsString(
        error,
      )}]`;
      logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    logger.debug(
      `Generated settlement transactions input: ${JSON.stringify(
        settlementTransactionInput,
      )}`,
    );

    let settlementTransaction: STRSettlementTransaction;

    try {
      settlementTransaction =
        await this.strClientService.createSettlementTransaction(
          settlementTransactionInput,
        );
    } catch (error) {
      const errorMessage = `Could not save STRSettlementTransaction into STR. Error[${errorAsString(
        error,
      )}]`;
      logger.error(errorMessage);

      throw new BadRequestException(errorMessage);
    }

    logger.info(
      `Settlement transaction ${settlementTransaction.id} (stx hash: ${settlementTransaction.hash}) created for instrument at ${input.instrumentAddress}`,
    );
    logger.debug(
      `Settlement transaction ${settlementTransaction.id} (stx hash: ${settlementTransaction.hash}) created for instrument at ${input.instrumentAddress}`,
      JSON.stringify(settlementTransaction),
    );
    const blockchainParams = {
      txId: uuidToFixed(settlementTransaction.id),
      operationId: uuidToFixed(settlementTransaction.operationId),
      deliverySenderAccountNumber:
        settlementTransaction.deliverySenderAccountNumber,
      deliveryReceiverAccountNumber:
        settlementTransaction.deliveryReceiverAccountNumber,
      deliveryQuantity: settlementTransaction.deliveryQuantity,
      txHash: settlementTransaction.hash,
    };

    let transactionHash: string;

    switch (forgeOperationType) {
      case ForgeOperationType.TRADE:
        logger.info(
          `Initiate trade for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with transactionHash ${settlementTransaction.hash}`,
        );
        logger.debug(
          `Initiate trade for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with transactionHash ${settlementTransaction.hash}`,
          JSON.stringify(blockchainParams),
        );
        const initiateTradeReturn = await instrumentContract.initiateTrade(
          blockchainParams,
        );
        transactionHash = initiateTradeReturn.transactionId;
        break;
      case ForgeOperationType.SUBSCRIPTION:
        logger.info(
          `Initiate subscription for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with transactionHash ${settlementTransaction.hash}`,
        );
        logger.debug(
          `Initiate subscription for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with transactionHash ${settlementTransaction.hash}`,
          JSON.stringify(blockchainParams),
        );
        const initiateSubscriptionReturn =
          await instrumentContract.initiateSubscription(blockchainParams);
        transactionHash = initiateSubscriptionReturn.transactionId;
        break;
      default:
        throw new BadRequestException(
          `forgeOperationType is not a valid operation type : ${forgeOperationType}`,
        );
    }

    return transactionHash;
  }

  private async generateSettlementTransactionsInputTrade({
    buyerAddresses,
    sellerAddresses,
    settlementDate,
    operationId,
    instrumentAddress,
    instrumentLedger,
    deliveryQuantity,
    paymentAmount,
    paymentCurrency,
    additionalReaderAddresses,
    tradeId,
    tradeDate,
    settlementModel,
    holdableTokenAddress,
    intermediateAccountIBAN,
  }: InitiateTradeInput): Promise<CreateOracleSettlementTransactionInput> {
    const cashMovements: CreateMovementInput[] = [];

    if (settlementModel === SettlementModel.INDIRECT) {
      if (typeof intermediateAccountIBAN !== 'string') {
        throw new BadRequestException(
          'Indirect settlement transaction must have an intermediateAccountIBAN',
        );
      }
      const buyerToSettlerCashMovementInput: CreateMovementInput =
        generateCashMovementInput(
          buyerAddresses,
          { paymentAccountNumber: intermediateAccountIBAN },
          operationId,
        );
      const settlerToSellerCashMovementInput: CreateMovementInput =
        generateCashMovementInput(
          { paymentAccountNumber: intermediateAccountIBAN },
          sellerAddresses,
          operationId,
        );

      cashMovements.push(buyerToSettlerCashMovementInput);
      cashMovements.push(settlerToSellerCashMovementInput);
    } else {
      if (typeof holdableTokenAddress !== 'string') {
        throw new BadRequestException(
          'Direct settlement transaction must have an holdableTokenAddress',
        );
      }
      const buyerToSellerCashMovementInput: CreateMovementInput =
        generateCashMovementInput(buyerAddresses, sellerAddresses, operationId);
      cashMovements.push(buyerToSellerCashMovementInput);
    }

    const tokenMovement = generateTokenMovementInput(
      sellerAddresses,
      buyerAddresses,
    );

    return generateSettlementTransactionInput(
      deliveryQuantity,
      paymentAmount,
      paymentCurrency,
      settlementDate,
      operationId,
      instrumentAddress,
      instrumentLedger,
      buyerAddresses,
      sellerAddresses,
      [...cashMovements, tokenMovement],
      additionalReaderAddresses || [],
      tradeId,
      tradeDate,
      settlementModel,
      holdableTokenAddress,
      intermediateAccountIBAN,
    );
  }

  private async generateSettlementTransactionsInputSubscription(
    issuerDeliveryAccountNumber: string,
    {
      investorAddresses,
      issuerAddresses: issuerAddressesWithoutDelivery,
      settlementDate,
      operationId,
      instrumentAddress,
      instrumentLedger,
      deliveryQuantity,
      paymentAmount,
      paymentCurrency,
      additionalReaderAddresses,
      tradeId,
      tradeDate,
      settlementModel,
      holdableTokenAddress,
      intermediateAccountIBAN,
    }: InitiateSubscriptionInput,
  ): Promise<CreateOracleSettlementTransactionInput> {
    const issuerAddresses: ParticipantAdresses = {
      deliveryAccountNumber: issuerDeliveryAccountNumber,
      ...issuerAddressesWithoutDelivery,
    };
    const cashMovements: CreateMovementInput[] = [];
    if (settlementModel === SettlementModel.INDIRECT) {
      if (typeof intermediateAccountIBAN !== 'string') {
        throw new BadRequestException(
          'Indirect settlement transaction must have an intermediateAccountIBAN',
        );
      }
      const investorToSettlerCashMovementInput: CreateMovementInput =
        generateCashMovementInput(
          investorAddresses,
          { paymentAccountNumber: intermediateAccountIBAN },
          operationId,
        );
      cashMovements.push(investorToSettlerCashMovementInput);

      const settlerToIssuerCashMovement = generateCashMovementInput(
        { paymentAccountNumber: intermediateAccountIBAN },
        issuerAddresses,
        operationId,
      );
      cashMovements.push(settlerToIssuerCashMovement);
    } else {
      if (typeof holdableTokenAddress !== 'string') {
        throw new BadRequestException(
          'Direct settlement transaction must have an holdableTokenAddress',
        );
      }
      const investorToIssuerCashMovement = generateCashMovementInput(
        investorAddresses,
        issuerAddresses,
        operationId,
      );
      cashMovements.push(investorToIssuerCashMovement);
    }

    const tokenMovement: CreateMovementInput = generateTokenMovementInput(
      issuerAddresses,
      investorAddresses,
    );

    return generateSettlementTransactionInput(
      deliveryQuantity,
      paymentAmount,
      paymentCurrency,
      settlementDate,
      operationId,
      instrumentAddress,
      instrumentLedger,
      investorAddresses,
      issuerAddresses,
      [...cashMovements, tokenMovement],
      additionalReaderAddresses || [],
      tradeId,
      tradeDate,
      settlementModel,
      holdableTokenAddress,
      intermediateAccountIBAN,
    );
  }

  public async cancelSettlementTransaction(
    input: CancelSettlementTransactionInput,
  ): Promise<string> {
    const logger = getLogger(
      this.constructor.name,
      'cancelSettlementTransaction',
    );
    logger.debug(
      `cancel Settlement Transaction with input: ${JSON.stringify(input)}`,
    );

    if (input.instrumentLedger === Ledger.TEZOS) {
      const errorMessage = `NOT TEZOS YET`;
      logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    const instrumentContract = await this.blockchainService.getForgeBond(
      input.instrumentLedger,
      input.instrumentAddress,
    );

    if (!UUID.validate(input.settlementTransactionId)) {
      throw new BadRequestException(
        `settlementTransactionId is not a valid uuid : ${input.settlementTransactionId}`,
      );
    }
    let settlementTransaction;
    try {
      settlementTransaction =
        await this.strClientService.getSettlementTransaction(
          input.settlementTransactionId,
        );
    } catch (error) {
      const errorMessage = `Could not get STRSettlementTransaction into STR. Error[${errorAsString(
        error,
      )}]`;
      logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    const blockchainParams = {
      txId: uuidToFixed(settlementTransaction.id),
      operationId: uuidToFixed(settlementTransaction.operationId),
      deliverySenderAccountNumber:
        settlementTransaction.deliverySenderAccountNumber,
      deliveryReceiverAccountNumber:
        settlementTransaction.deliveryReceiverAccountNumber,
      deliveryQuantity: settlementTransaction.deliveryQuantity,
      txHash: settlementTransaction.hash,
    };

    logger.info(
      `cancel Settlement Transaction for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with blockchainParams ${blockchainParams}`,
    );
    logger.debug(
      `cancel Settlement Transaction for instrument at address ${input.instrumentAddress} on ${input.instrumentLedger} with blockchainParams ${blockchainParams}`,
      JSON.stringify(blockchainParams),
    );
    const cancelTransactionReturn =
      await instrumentContract.cancelSettlementTransaction(blockchainParams);
    const transactionHash: string = cancelTransactionReturn.transactionId;

    return transactionHash;
  }
}
