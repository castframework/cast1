import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SettlementTransactionParticipantAddresses {
  @Field()
  public securityDeliverer: string;

  @Field()
  public securityReceiver: string;

  @Field()
  public securityIssuer: string;

  @Field()
  public settler: string;

  @Field()
  public registrar: string;
}

@ObjectType()
export class LightSettlementTransaction {
  public constructor(
    id: string,
    participantAccountNumbers: SettlementTransactionParticipantAddresses,
  ) {
    this.id = id;
    this.participantAccountNumbers = participantAccountNumbers;
  }

  @Field()
  public id: string;

  @Field((returns) => SettlementTransactionParticipantAddresses)
  public participantAccountNumbers: SettlementTransactionParticipantAddresses;
}

export function isLightSettlementTransaction(
  lightSettlementTransaction: any,
): lightSettlementTransaction is LightSettlementTransaction {
  if (
    !lightSettlementTransaction ||
    !lightSettlementTransaction.id ||
    !lightSettlementTransaction.participantAccountNumbers ||
    !lightSettlementTransaction.settlementTransactionOperationType
  ) {
    return false;
  } else {
    return true;
  }
}
