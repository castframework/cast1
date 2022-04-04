import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common/';
import { ForgePubSub } from '../../utils/PubSub.wrapper';
import { errorAsString } from '../../utils/errorAsString';
import { EVENT_HEARTBEAT } from '../fro/fro.event.constant';
import { FxoConfig } from './fxo.config';
import { HeartbeatNotification, LedgerBlockInfo } from '@castframework/models';
import { BlockchainService } from '../../shared/services/blockchain.service';
import { BlockInfo } from '@castframework/transaction-manager';

@Injectable()
export class HeartBeatService implements OnModuleInit, OnModuleDestroy {
  private logger: Logger = getLogger(this.constructor.name);
  private heartbeatIntervalId: NodeJS.Timeout;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly pubSub: ForgePubSub,
    private readonly fxoConfig: FxoConfig,
  ) {}

  onModuleInit(): void {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.logger.debug(`Starting heartbeat`);
    this.heartbeatIntervalId = setInterval(async () => {
      const blockInfos: LedgerBlockInfo[] = [];
      for (const ledger of this.blockchainService.supportedLedgers) {
        let currentBlockInfo: BlockInfo | undefined;
        try {
          currentBlockInfo = await this.blockchainService.getCurrentBlockInfo(
            ledger,
          );
        } catch (error) {
          this.logger.error(
            `[${ledger}] Error getting current block info : ${errorAsString(
              error,
            )}`,
          );
        }
        blockInfos.push({
          ledger,
          blockNumber:
            currentBlockInfo === undefined ? -1 : currentBlockInfo.blockNumber,
          blockHash:
            currentBlockInfo === undefined ? 'N/A' : currentBlockInfo.blockHash,
        });
      }

      await this.pubSub.publish(
        EVENT_HEARTBEAT,
        new HeartbeatNotification(blockInfos),
      );
    }, this.fxoConfig.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    clearInterval(this.heartbeatIntervalId);
  }

  onModuleDestroy(): void {
    this.logger.debug('Stopping heartbeat');
    this.stopHeartbeat();
    this.logger.debug('Heartbeat stopped');
  }
}
