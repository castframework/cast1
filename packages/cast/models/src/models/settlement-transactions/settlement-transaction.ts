import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { SettlementTransactionStatus, SettlementTransactionType } from '.';
import { Ledger } from '../constants';
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { CreateMovementInput, Movement } from './movement';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ColumnNumericTransformer } from '../../utils/utils';
import { Currency, SettlementModel } from '../operations';

@Entity()
@ObjectType()
export class STRSettlementTransaction {
  @PrimaryColumn()
  @IsUUID('4')
  @Field()
  public id: string;

  @Column({
    type: 'enum',
    enum: SettlementTransactionType,
    default: SettlementTransactionType.DVP,
  })
  @IsEnum(SettlementTransactionType)
  @Field((returns) => SettlementTransactionType)
  public settlementType: SettlementTransactionType;

  @Column()
  @IsDate()
  @Field()
  public settlementDate: Date;

  @Column()
  @IsUUID('4')
  @Field()
  public operationId: string;

  @Column()
  @IsString()
  @Field()
  public instrumentPublicAddress: string;

  @Column({
    type: 'enum',
    enum: Ledger,
  })
  @IsEnum(Ledger)
  @Field((returns) => Ledger)
  // todo: remplacer par juste ledger
  public instrumentLedger: Ledger;

  @Column('numeric', {
    transformer: new ColumnNumericTransformer(),
  })
  @IsNumber()
  @Field()
  public deliveryQuantity: number;

  @Column()
  @IsString()
  @Field()
  public deliverySenderAccountNumber: string;

  @Column()
  @IsString()
  @Field()
  public deliveryReceiverAccountNumber: string;

  @Column('bigint', {
    transformer: new ColumnNumericTransformer(),
  })
  @IsNumber({
    maxDecimalPlaces: 0,
  })
  @Field()
  public paymentAmount: number;

  @Column({
    type: 'enum',
    enum: Currency,
  })
  @IsEnum(Currency)
  @Field((returns) => Currency)
  public paymentCurrency: Currency;

  @Column()
  @IsString()
  @Field()
  public paymentReceiverAccountNumber: string;

  @Column()
  @IsString()
  @Field()
  public paymentSenderAccountNumber: string;

  @Column()
  @IsString()
  @Field()
  public paymentSenderLegalEntityId: string;

  @Column()
  @IsString()
  @Field()
  public paymentReceiverLegalEntityId: string;

  @JoinTable({
    name: 'settlement_transaction_movement',
  })
  @ManyToMany(() => Movement, (mvt) => mvt.settlementTransactions, {
    cascade: true,
  })
  @Field((type) => [Movement])
  public movements?: Movement[];

  @Column()
  @IsString()
  @Field()
  public hash: string;

  @IsOptional()
  @IsUUID('4')
  @Column({ nullable: true })
  @Field({ nullable: true })
  public tradeId?: string;

  @Field()
  @Column({ type: 'timestamp' })
  @IsDate()
  public tradeDate: Date;

  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  @Field(() => [String], { nullable: true })
  public additionalReaderAddresses?: string[];

  @Field((returns) => SettlementModel)
  @Column({
    type: 'enum',
    enum: SettlementModel,
  })
  @IsEnum(SettlementModel)
  public settlementModel: SettlementModel;

  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  @Field({ nullable: true })
  public holdableTokenAddress?: string;

  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  @Field({ nullable: true })
  public intermediateAccountIBAN?: string;
}

@ObjectType('OracleSettlementTransaction')
export class OracleSettlementTransaction extends STRSettlementTransaction {
  @Column({
    type: 'enum',
    enum: SettlementTransactionStatus,
    default: SettlementTransactionStatus.INITIATED,
  })
  @IsEnum(SettlementTransactionStatus)
  @Field((returns) => SettlementTransactionStatus)
  public settlementStatus: SettlementTransactionStatus;
}

@InputType()
export class CreateOracleSettlementTransactionInput extends OmitType(
  OracleSettlementTransaction,
  ['settlementStatus', 'movements'],
  InputType,
) {
  @Field((type) => [CreateMovementInput])
  public movements: CreateMovementInput[];
}
