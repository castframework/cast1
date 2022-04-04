import { Field, ObjectType } from '@nestjs/graphql';
import { Ledger } from '../constants';
import { Currency } from '../operations';

@ObjectType()
export class InstrumentPosition {
  @Field()
  public instrumentAddress: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((type) => Ledger)
  public ledger: Ledger;

  @Field()
  public balance: number;

  @Field()
  public legalEntityAddress: string;

  @Field()
  public symbol: string;

  @Field()
  public valueInFiat: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((type) => Currency)
  public currency: Currency;

  @Field({ nullable: true })
  public percentage?: number;

  @Field({ nullable: true })
  public unlocked?: number;

  @Field({ nullable: true })
  public locked?: number;
}
