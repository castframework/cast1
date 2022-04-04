import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RegistryNotificationName } from './constants';
import { Ledger } from '../constants';

@ObjectType()
export class RegistryNotification {
  @Field((returns) => RegistryNotificationName)
  public notificationName: RegistryNotificationName;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field()
  public instrumentAddress: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((returns) => Ledger)
  public instrumentLedger: Ledger;

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((type) => ID, { nullable: true })
  public transactionHash: string;

  public constructor(
    notificationName: RegistryNotificationName,
    instrumentAddress: string,
    instrumentLedger: Ledger,
    transactionHash: string,
  ) {
    this.notificationName = notificationName;
    this.instrumentAddress = instrumentAddress;
    this.instrumentLedger = instrumentLedger;
    this.transactionHash = transactionHash;
  }
}

export function isRegistryNotification(
  registryNotification: any,
): registryNotification is RegistryNotification {
  if (!registryNotification || !registryNotification.notificationName) {
    return false;
  }

  if (RegistryNotificationName[registryNotification.notificationName]) {
    return true;
  }

  return false;
}
