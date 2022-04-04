import {
  Field,
  GraphQLISODateTime,
  InputType,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';

import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { EmtnType, InstrumentType, Underlying } from './constants';
import { Instrument } from '.';

@ObjectType({
  implements: [Instrument],
})
@InputType('EMTNInput')
export class EMTN extends Instrument {
  public type: InstrumentType.EMTN;

  // TODO: #1499 Forge annotation
  @Field((returns) => EmtnType, { nullable: true })
  @IsEnum(EmtnType)
  public EmtnType?: EmtnType;

  @Field((returns) => Underlying, { nullable: true })
  @IsOptional()
  @IsEnum(Underlying)
  public underlying?: Underlying;

  @IsOptional()
  @IsNumber()
  @Field({ nullable: true })
  public barrier1?: number;

  @IsOptional()
  @IsNumber()
  @Field({ nullable: true })
  public barrier2?: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  public isAutocall?: boolean;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  public autocallFrequencyInMonths?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  @IsOptional()
  public firstAutocallDate?: Date;
}

// ça pourrait etre juste EMTN du coup
@InputType()
export class CreateEMTNInput extends OmitType(EMTN, ['id', 'type'], InputType) {
  @Field()
  public issuerId: string;
  @Field({ nullable: true })
  public registrarId?: string;
  @Field({ nullable: true })
  public settlementAgentId?: string;
}
