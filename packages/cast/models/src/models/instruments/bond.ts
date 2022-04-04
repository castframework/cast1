import {
  Field,
  GraphQLISODateTime,
  InputType,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';
import { Instrument, InstrumentType } from '.';
import { IsBoolean, IsDate, IsNumber, IsOptional } from 'class-validator';

@ObjectType({
  implements: [Instrument],
})
@InputType('BondInput')
export class Bond extends Instrument {
  public type: InstrumentType.Bond;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  @IsOptional()
  public extendedMaturityDate?: Date;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  public isSoftBullet?: boolean;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public softBulletPeriodInMonths?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public spread?: number;
}

@InputType()
export class UpdateBondInput extends OmitType(Bond, ['type'], InputType) {
  @Field()
  public issuerId: string;
  @Field({ nullable: true })
  public registrarId?: string;
  @Field({ nullable: true })
  public settlementAgentId?: string;
}

@InputType()
export class CreateBondInput extends OmitType(
  UpdateBondInput,
  ['id'],
  InputType,
) {}
