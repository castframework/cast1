import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DataProviderNotificationName } from './constants';

@ObjectType()
export class DataProviderNotification {
  @Field((returns) => DataProviderNotificationName)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((type) => ID, { nullable: true })
  public transactionHash: string;

  public constructor(transactionHash: string) {
    this.transactionHash = transactionHash;
  }
}

export function isDataProviderNotification(
  dpoNotification: any,
): dpoNotification is DataProviderNotification {
  if (!dpoNotification || !dpoNotification.notificationName) {
    return false;
  }

  if (DataProviderNotificationName[dpoNotification.notificationName]) {
    return true;
  }

  return false;
}
