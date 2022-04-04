import {
  Field,
  GraphQLISODateTime,
  InputType,
  InterfaceType,
  ObjectType,
} from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InstrumentStatus, InstrumentType } from './constants';
import { Ledger } from '../constants';
import { Bond, EMTN } from '.';
import { Currency } from '../operations';

@InterfaceType({
  resolveType(instrument: Instrument) {
    switch (instrument.type) {
      case InstrumentType.Bond:
        return Bond;
      case InstrumentType.EMTN:
        return EMTN;
      default:
        return null;
    }
  },
})
@InputType('InstrumentInput')
export abstract class Instrument {
  @Field()
  @IsString()
  public id: string;

  @Field((returns) => InstrumentType)
  @IsEnum(InstrumentType)
  public type: InstrumentType;

  @Field()
  @IsString()
  public symbol: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((returns) => InstrumentStatus)
  @IsEnum(InstrumentStatus)
  public status: InstrumentStatus;

  @Field()
  @IsString()
  public isinCode: string;

  @Field()
  @IsString()
  public cfiCode: string;

  @Field()
  @IsString()
  public commonCode: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Field((returns) => Ledger)
  @IsEnum(Ledger)
  public ledger: Ledger;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  @IsOptional()
  public startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  @IsOptional()
  public maturityDate?: Date;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public denomination?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  public nominalAmount?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public decimals?: number;

  @Field((returns) => Currency, { nullable: true })
  @IsEnum(Currency)
  public currency?: Currency;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public couponRateInBips?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public couponFrequencyInMonths?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  @IsOptional()
  public firstCouponDate?: Date;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  public isCallable?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public callFrequency?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public registrarAgentAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  public settlerAgentAddress?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public issuerAddress?: string;
}

@ObjectType()
export class InstrumentDetails {
  @Field()
  public issuer: string;
  @Field()
  public registrarAgentAddress: string;
  @Field()
  public settlerAgentAddress: string;
  @Field()
  public contractAddress: string;
  @Field()
  public initialSupply: number;
  @Field()
  public isinCode: string;
  @Field()
  public name: string;
  @Field()
  public symbol: string;
  @Field()
  public denomination: number;
  @Field()
  public divisor: number;
  @Field()
  public startDate: number;
  @Field()
  public maturityDate: number;
  @Field()
  public firstCouponDate: number;
  @Field()
  public couponFrequencyInMonths: number;
  @Field()
  public interestRateInBips: number;
  @Field()
  public callable: boolean;
  @Field()
  public isSoftBullet: boolean;
  @Field()
  public softBulletPeriodInMonths: number;
  @Field()
  public type: string;
}
