import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ContractNotificationName } from './constants';
import { LightSettlementTransaction } from './light-settlement-transaction';

@ObjectType()
export class ContractNotification {
  @Field((returns) => ContractNotificationName)
  public notificationName: ContractNotificationName;

  @Field()
  public instrumentAddress: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((type) => ID, { nullable: true })
  public transactionHash: string;

  @Field((returns) => [LightSettlementTransaction])
  public lightSettlementTransactions: LightSettlementTransaction[];

  @Field()
  public settlementTransactionOperationType: string;

  public constructor(
    notificationName: ContractNotificationName,
    instrumentAddress: string,
    transactionHash: string,
    lightSettlementTransactions: LightSettlementTransaction[],
    settlementTransactionOperationType: string,
  ) {
    this.notificationName = notificationName;
    this.instrumentAddress = instrumentAddress;
    this.lightSettlementTransactions = lightSettlementTransactions;
    this.transactionHash = transactionHash;
    this.settlementTransactionOperationType =
      settlementTransactionOperationType;
  }
}

export function isContractNotification(
  contractNotification: any,
): contractNotification is ContractNotification {
  if (!contractNotification || !contractNotification.notificationName) {
    return false;
  }

  if (ContractNotificationName[contractNotification.notificationName]) {
    return true;
  }

  return false;
}
