import { getLogger, Logger } from '../../utils/logger';
import {
  Ledger,
  ContractNotification,
  LightSettlementTransaction,
  RegistryNotification,
} from '@castframework/models';
import { Injectable } from '@nestjs/common/';
import { bnToUuid } from '../../utils/bigNumberUtils';
import { ForgePubSub } from '../../utils/PubSub.wrapper';
import { validateLedgerContractAddress } from '../../utils/blockchainUtils';
import { errorAsString } from '../../utils/errorAsString';
import {
  EVENT_CONTRACT_NOTIFICATION,
  EVENT_REGISTRY_NOTIFICATION,
} from '../fro/fro.event.constant';
import BigNumber from 'bignumber.js';
import { asyncForEach } from '../../utils/promiseUtils';
import { FxoSettlementInfoService } from './settlementInfoService.service';
import {
  ContractNotificationName,
  RegistryNotificationName,
} from '../../shared/env-constant/notificationNames';
import { BlockchainService } from '../../shared/services/blockchain.service';
import {
  ForgeBond,
  ForgeBondAllEvents,
  FORGEBOND_CONTRACT_EVENT_PAYMENT_RECEIVED,
  FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
  FORGEBOND_CONTRACT_EVENT_REDEMPTION_INITIATED,
  FORGEBOND_CONTRACT_EVENT_SUBSCRIPTION_INITIATED,
  FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER,
  FORGEBOND_CONTRACT_EVENT_TRADE_INITIATED,
  FORGEBONDFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED,
  FORGEBOND_CONTRACT_EVENT_SETTLEMENT_CANCELED,
  ForgeBondTransferEvent,
  isSingleSettlementTransaction,
  SettlementTransactionTypeCodeMap,
  isSettlementTransactionOperationType,
  OPERATION_TYPE_SUBSCRIPTION,
  OPERATION_TYPE_TRADE,
  OPERATION_TYPE_REDEMPTION,
} from '@castframework/cast-interface-v1';

type EventHandler = (
  event: ForgeBondAllEvents,
  LedgerType: Ledger,
) => Promise<void>;

@Injectable()
export class EventService {
  private logger: Logger = getLogger(this.constructor.name);
  private listenedContracts: Set<string> = new Set<string>();
  private listenedFactories: Set<string> = new Set<string>();
  private instrumentEventHandlers: Map<string, EventHandler[]> = new Map();

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly pubSub: ForgePubSub,
    private readonly settlementInfoService: FxoSettlementInfoService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initialize();
  }

  public addInstrumentEventHandler(
    event: string,
    handler: EventHandler,
  ): number {
    const existing = this.instrumentEventHandlers[event];

    if (Array.isArray(existing)) {
      return existing.push(handler);
    } else {
      this.instrumentEventHandlers[event] = [handler];
      return 0;
    }
  }

  public removeInstrumentEvenHandler(event: string, handlerId: number): void {
    const handlers = this.instrumentEventHandlers[event];
    if (handlers && handlerId >= 0) {
      handlers.splice(handlerId, 1);
    }
  }

  public async initialize(): Promise<void> {
    this.addContractNotificationForwader();

    for (const ledger of this.blockchainService.supportedLedgers) {
      try {
        await this.subscribeEventFactories(ledger);
        await this.subscribeToTokenInDirectory(ledger);
      } catch (error) {
        this.logger.error(
          `Error during ledger[${ledger}] initialization : ${errorAsString(
            error,
          )}`,
        );
      }
    }
  }

  private addContractNotificationForwader(): void {
    const events = [
      FORGEBOND_CONTRACT_EVENT_SUBSCRIPTION_INITIATED,
      FORGEBOND_CONTRACT_EVENT_TRADE_INITIATED,
      FORGEBOND_CONTRACT_EVENT_PAYMENT_RECEIVED,
      FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
      FORGEBOND_CONTRACT_EVENT_REDEMPTION_INITIATED,
      FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER,
      FORGEBOND_CONTRACT_EVENT_SETTLEMENT_CANCELED,
    ];

    events.forEach((event) => {
      this.logger.debug(`Adding forwarder for event ${event}`);
      this.addInstrumentEventHandler(
        event,
        this.handleInstrumentContractEvent.bind(this),
      );
    });
  }

  private async subscribeToTokenInDirectory(ledger: Ledger): Promise<void> {
    const logger = getLogger(
      this.constructor.name,
      'subscribeToTokenInDirectory',
    );
    logger.debug(`[${ledger}] Subscribing to token in directory`);
    const instrumentRegistry =
      await this.blockchainService.getRegistryFromLedger(ledger, logger);

    const contractAddressList = await instrumentRegistry.getAllInstruments();

    logger.info(
      `Listening to ${contractAddressList.length} existing instruments on ${ledger}`,
    );
    logger.debug(
      `Listening to ${contractAddressList.length} existing instruments on ${ledger}`,
      JSON.stringify(contractAddressList),
    );

    // todo : ici filtrer les tokens pour ne conserver que ceux dont on est registrar ? (à voir : et si ça change ?)
    await asyncForEach(contractAddressList, async (contractAddress) => {
      await this.subscribeToNewContract(contractAddress, ledger);
    });
  }

  private async subscribeEventFactories(ledger: Ledger): Promise<void> {
    const logger = getLogger(this.constructor.name, 'subscribeEventFactories');
    const registry = await this.blockchainService.getRegistryFromLedger(
      ledger,
      logger,
    );

    const instrumentTypes = await registry.getAllFactoryTypes();

    await Promise.all(
      instrumentTypes.map((instrumentType) =>
        this.subscribeEventFactory(ledger, instrumentType),
      ),
    );
  }

  private async subscribeEventFactory(
    ledger: Ledger,
    instrumentType: string,
  ): Promise<void> {
    const logger = getLogger(this.constructor.name, 'subscribeEventFactory');
    const factoryAddress = await this.blockchainService.getFactoryAddress(
      ledger,
      instrumentType,
    );

    if (factoryAddress === undefined) {
      // This may need to be handled by the config service
      // need the same thing for tezos
      logger.error(
        `Factory address is not defined for ledger ${ledger} and instrument type ${instrumentType}`,
      );
      return;
    }

    if (!validateLedgerContractAddress(factoryAddress, ledger)) {
      // This may need to be handled by the config service
      // need the same thing for tezos
      logger.error(
        `[${ledger}] Factory address : ${factoryAddress} is not a valid address`,
      );
      return;
    }

    if (this.listenedFactories.has(factoryAddress)) {
      logger.debug(
        `[${ledger}] Already listening to factory ${factoryAddress}`,
      );
      return;
    }
    try {
      this.listenedFactories.add(factoryAddress);

      const factoryContract = await this.blockchainService.getForgeBondFactory(
        ledger,
        factoryAddress,
      );

      logger.info(
        `[${ledger}] Start listening to events for factory address (${instrumentType}): ${factoryAddress}`,
      );
      factoryContract.InstrumentListed().subscribe(async (event) => {
        logger.info(
          `Received ${FORGEBONDFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED} event on ${ledger} for instrument ${event.payload._instrumentAddress}`,
        );
        const registryNotification: RegistryNotification =
          new RegistryNotification(
            RegistryNotificationName.InstrumentListed,
            event.payload._instrumentAddress,
            ledger,
            event.transactionId,
          );

        await this.pubSub.publish(
          EVENT_REGISTRY_NOTIFICATION,
          registryNotification,
        );
        await this.subscribeToNewContract(
          event.payload._instrumentAddress,
          ledger,
          event.blockNumber,
        );
      });
    } catch (err) {
      logger.error(
        `[${ledger}] Error subscribing to factory ${factoryAddress} : ${errorAsString(
          err,
        )}`,
      );
      this.listenedFactories.delete(factoryAddress);
    }
  }

  private async listenContract(
    contract: ForgeBond<never>,
    LedgerType: Ledger,
    from?: number,
  ): Promise<void> {
    contract.allEvents().subscribe(async (event) => {
      try {
        this.logger.debug(
          `[${LedgerType}] Received event[${JSON.stringify(event)}]`,
        );
        if (event && event.transactionId) {
          await this.executeInstrumentEventHandlers(event, LedgerType);
        }
      } catch (err) {
        this.logger.error(
          `[${LedgerType}] Error handling event[${JSON.stringify(
            event,
          )}] error[${errorAsString(err)}]`,
        );
      }
    });
  }

  private async executeInstrumentEventHandlers(
    event: ForgeBondAllEvents,
    LedgerType: Ledger,
  ): Promise<void> {
    const { eventName } = event;

    const handlers: EventHandler[] =
      this.instrumentEventHandlers[eventName] ?? [];

    handlers.forEach((handler) => handler(event, LedgerType));
  }

  public async subscribeToNewContract(
    contractAddress: string,
    LedgerType: Ledger,
    from?: number,
  ): Promise<void> {
    if (!validateLedgerContractAddress(contractAddress, LedgerType)) {
      this.logger.error(
        `[${LedgerType}] Contract address : ${contractAddress} is not a valid address`,
      );
      return;
    }
    if (this.listenedContracts.has(contractAddress)) {
      this.logger.debug(
        `[${LedgerType}] Already listening to contract ${contractAddress}`,
      );
      return;
    }
    try {
      this.listenedContracts.add(contractAddress);
      const contract = await this.blockchainService.getForgeBond(
        LedgerType,
        contractAddress,
      );
      this.logger.debug(
        `[${LedgerType}] Start listening to events for contract address: ${contractAddress}${
          from ? ` from block ${from}` : ''
        }`,
      );
      await this.listenContract(contract, LedgerType, from);
    } catch (err) {
      this.logger.error(
        `[${LedgerType}] Error subscribing to contract ${contractAddress}${
          from ? ` from block ${from}` : ''
        } : ${errorAsString(err)}`,
      );
      this.listenedContracts.delete(contractAddress);
    }
  }

  private async handleInstrumentContractEvent(
    event: ForgeBondAllEvents,
    ledger: Ledger,
  ): Promise<void> {
    const logger = getLogger(
      this.constructor.name,
      'handleInstrumentContractEvent',
    );
    logger.info(
      `Received ${event.eventName} event on ${ledger} for instrument ${event.smartContractAddress} with transaction hash ${event.transactionId}`,
    );
    logger.debug(
      `Received ${event.eventName} event on ${ledger} for instrument ${event.smartContractAddress} with transaction hash ${event.transactionId}`,
      JSON.stringify(event),
    );
    const notification =
      event.eventName === FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER
        ? await this.handleInstrumentContractTokenTransfer(event, ledger)
        : await this.handleInstrumentContractSettlementEvent(event, ledger);

    await this.pubSub.publish(EVENT_CONTRACT_NOTIFICATION, notification);
  }

  private async handleInstrumentContractTokenTransfer(
    event: ForgeBondTransferEvent,
    ledger: Ledger,
  ): Promise<ContractNotification> {
    return new ContractNotification(
      event.eventName as ContractNotificationName,
      event.smartContractAddress,
      event.transactionId as string,
      [
        {
          id: 'no Data',
          participantAccountNumbers: {
            securityDeliverer: event.payload._from,
            securityReceiver: event.payload._to,
            securityIssuer: 'no Data',
            settler: 'no Data',
            registrar: 'no Data',
          },
        },
      ],
      'no Data',
    );
  }

  private async handleInstrumentContractSettlementEvent(
    event: Exclude<ForgeBondAllEvents, ForgeBondTransferEvent>,
    ledger: Ledger,
  ): Promise<ContractNotification> {
    const settlementTransactionIds: string[] = isSingleSettlementTransaction(
      event.payload,
    )
      ? [event.payload.settlementTransactionId]
      : event.payload.settlementTransactionIds;

    const lightSettlementTransactionsPromises =
      await settlementTransactionIds.map(
        async (settlementTransactionId) =>
          await this.buildlightSettlementTransaction(settlementTransactionId),
      );

    const lightSettlementTransactions: LightSettlementTransaction[] =
      await Promise.all(lightSettlementTransactionsPromises);

    const settlementTransactionOperationType: string =
      isSettlementTransactionOperationType(event.payload)
        ? SettlementTransactionTypeCodeMap[
            event.payload.settlementTransactionOperationType
          ]
        : this.retrieveSettlementTransactionOperationType(
            event.eventName as ContractNotificationName,
          );

    return new ContractNotification(
      event.eventName as ContractNotificationName,
      event.smartContractAddress,
      event.transactionId,
      lightSettlementTransactions,
      settlementTransactionOperationType,
    );
  }

  private async buildlightSettlementTransaction(
    uuid: string,
  ): Promise<LightSettlementTransaction> {
    const id = bnToUuid(new BigNumber(uuid));

    const participantAccountNumbers =
      await this.settlementInfoService.getParticipantAccountNumbersForSettlementTransaction(
        id,
      );

    return {
      id: id,
      participantAccountNumbers: participantAccountNumbers,
    };
  }

  private retrieveSettlementTransactionOperationType(
    notificationName: ContractNotificationName,
  ): string {
    switch (notificationName) {
      case ContractNotificationName.SubscriptionInitiated:
        return OPERATION_TYPE_SUBSCRIPTION;
      case ContractNotificationName.TradeInitiated:
        return OPERATION_TYPE_TRADE;
      case ContractNotificationName.RedemptionInitiated:
        return OPERATION_TYPE_REDEMPTION;
      default:
        return 'No Settlement Transaction Operation Type';
    }
  }
}
