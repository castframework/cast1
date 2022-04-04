import { Field, ObjectType } from '@nestjs/graphql';
import { Ledger } from '../constants';
import { HeartbeatNotificationName } from './constants';

@ObjectType()
export class LedgerBlockInfo {
  @Field((returns) => Ledger)
  public ledger: Ledger;
  @Field()
  public blockNumber: number;
  @Field()
  public blockHash: string;
}

@ObjectType()
export class HeartbeatNotification {
  public constructor(blockInfos: LedgerBlockInfo[]) {
    this.timestamp = Date.now();
    this.blockInfos = blockInfos;
    this.notificationName = HeartbeatNotificationName.Heartbeat;
  }
  @Field((returns) => HeartbeatNotificationName)
  public notificationName: HeartbeatNotificationName;

  @Field()
  public timestamp: number;

  @Field((returns) => [LedgerBlockInfo])
  public blockInfos: LedgerBlockInfo[];
}

export function isHeartbeatNotification(
  heartbeatNotification: any,
): heartbeatNotification is HeartbeatNotification {
  if (!heartbeatNotification || !heartbeatNotification.notificationName) {
    return false;
  }

  if (HeartbeatNotificationName[heartbeatNotification.notificationName]) {
    return true;
  }

  return false;
}
