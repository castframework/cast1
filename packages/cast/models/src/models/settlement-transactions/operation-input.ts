import { Field, InputType } from '@nestjs/graphql';
import { Ledger } from '../constants';
import { Currency, SettlementModel } from '../operations';

@InputType()
export class ParticipantAdresses {
  @Field()
  deliveryAccountNumber: string;

  @Field()
  paymentAccountNumber: string;

  @Field()
  legalEntityId: string;
}

@InputType()
export class ParticipantAdressesWithoutDelivery {
  @Field()
  paymentAccountNumber: string;

  @Field()
  legalEntityId: string;
}

@InputType()
export class OperationInput {
  @Field((type) => SettlementModel)
  public settlementModel: SettlementModel;

  @Field(() => String, { nullable: true })
  public intermediateAccountIBAN?: string;

  @Field(() => String, { nullable: true })
  public holdableTokenAddress?: string;

  @Field()
  public settlementDate: Date;

  @Field()
  public operationId: string;

  @Field()
  public instrumentAddress: string;

  @Field((type) => Ledger)
  public instrumentLedger: Ledger;

  @Field(() => [String], { nullable: true })
  public additionalReaderAddresses?: string[];

  @Field()
  public tradeId: string;

  @Field()
  public tradeDate: Date;
}
@InputType()
export class InitiateRedemptionInput extends OperationInput {
  @Field((type) => ParticipantAdressesWithoutDelivery)
  public issuerAddresses: ParticipantAdressesWithoutDelivery;

  @Field((type) => [ParticipantAdresses])
  public participantsAddresses: ParticipantAdresses[];
}

@InputType()
export class CancelSettlementTransactionInput {
  @Field()
  public settlementTransactionId: string;

  @Field()
  public instrumentAddress: string;

  @Field((type) => Ledger)
  public instrumentLedger: Ledger;
}

@InputType()
export class InitiateSubscriptionInput extends OperationInput {
  @Field((type) => ParticipantAdressesWithoutDelivery)
  public issuerAddresses: ParticipantAdressesWithoutDelivery;

  @Field((type) => ParticipantAdresses)
  public investorAddresses: ParticipantAdresses;

  @Field()
  public deliveryQuantity: number;

  @Field()
  public paymentAmount: number;

  @Field((type) => Currency)
  public paymentCurrency: Currency;
}

@InputType()
export class InitiateTradeInput extends OperationInput {
  @Field((type) => ParticipantAdresses)
  public buyerAddresses: ParticipantAdresses;

  @Field((type) => ParticipantAdresses)
  public sellerAddresses: ParticipantAdresses;

  @Field()
  public deliveryQuantity: number;

  @Field()
  public paymentAmount: number;

  @Field((type) => Currency)
  public paymentCurrency: Currency;
}

export enum ForgeOperationType {
  SUBSCRIPTION = 'Subscription',
  TRADE = 'Trade',
  REDEMPTION = 'Redemption',
}
