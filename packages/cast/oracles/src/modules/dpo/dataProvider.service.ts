import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { getLogger, Logger } from '../../utils/logger';
import {
  ForgeBondDataRequestEvent,
  DataProviderOracle,
  Ledger,
} from '@castframework/cast-interface-v1';
import { ForgePubSub } from '../../utils/PubSub.wrapper';
import { DataProviderNotification } from '@castframework/models';
import { DATA_REQUEST_NOTIFICATION } from './dataProvider.event.constant';
import { errorAsString } from '../../utils/errorAsString';
import { BlockchainService } from '../../shared/services/blockchain.service';
import { asyncForEach } from '../../utils/promiseUtils';

@Injectable()
export class DpoService {
  private logger: Logger = getLogger(this.constructor.name);
  private listenedContracts: Set<string> = new Set<string>();

  public constructor(
    private readonly pubSub: ForgePubSub,
    private readonly blockchainService: BlockchainService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initialize();
  }

  public async initialize(): Promise<void> {
    for (const ledger of this.blockchainService.supportedLedgers) {
      try {
        const instrumentRegistry =
          await this.blockchainService.getRegistryFromLedger(
            ledger,
            this.logger,
          );

        const contractAddressList =
          await instrumentRegistry.getAllInstruments();

        await asyncForEach(contractAddressList, async (contractAddress) => {
          await this.subscribeToNewContract(contractAddress, ledger);
        });
      } catch (error) {
        this.logger.error(
          `Error during ledger[${ledger}] initialization : ${errorAsString(
            error,
          )}`,
        );
      }
    }
  }

  public async subscribeToNewContract(
    contractAddress: string,
    LedgerType: Ledger,
    from?: number,
  ): Promise<void> {
    if (this.listenedContracts.has(contractAddress)) {
      this.logger.debug(
        `[${LedgerType}] Already listening to contract ${contractAddress}`,
      );
      return;
    }
    try {
      this.listenedContracts.add(contractAddress);
      const contract = await this.blockchainService.getDataProviderOracle(
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

  private async listenContract(
    contract: DataProviderOracle<never>,
    LedgerType: Ledger,
    from?: number,
  ): Promise<void> {
    contract.SubmitRequest().subscribe(async (event) => {
      try {
        this.logger.debug(
          `[${LedgerType}] Received event[${JSON.stringify(event)}]`,
        );
        if (event) {
          await this.handleSubmitRequestEvent(event, LedgerType);
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

  async handleSubmitRequestEvent(
    event: ForgeBondDataRequestEvent,
    ledger: Ledger,
  ): Promise<void> {
    const logger = getLogger(this.constructor.name, 'handleSubmitRequestEvent');

    logger.info(
      `Received ${event.eventName} event on ${ledger} for instrument ${event.smartContractAddress} with transaction hash ${event.transactionId}`,
    );

    const mockResponse = await axios.get('http://demo4607115.mockable.io/');

    const dataProviderOracle =
      await this.blockchainService.getDataProviderOracle(
        ledger,
        event.smartContractAddress,
      );

    const DECIMAL_CONVERSION = 6;

    await dataProviderOracle.WriteResult(
      event.payload.id,
      mockResponse.data.value,
      DECIMAL_CONVERSION,
      mockResponse.data.timestamp,
    );

    logger.debug(
      `Received ${event.eventName} event on ${ledger} for instrument ${event.smartContractAddress} with transaction hash ${event.transactionId}`,
      JSON.stringify(event),
    );

    const notification = new DataProviderNotification('exampleTransactionHash');

    await this.pubSub.publish(DATA_REQUEST_NOTIFICATION, notification);
  }

  public async dataRequest(contractAddress: string): Promise<string> {
    const bond = await this.blockchainService.getForgeBond(
      Ledger.ETHEREUM,
      contractAddress,
    );
    const data = await bond.RequestData();
    return data.transactionId;
  }
}
