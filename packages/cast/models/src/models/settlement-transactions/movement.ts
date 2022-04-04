import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { STRSettlementTransaction } from './settlement-transaction';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { MovementType } from './constants';

@Entity()
@ObjectType()
export class Movement {
  @PrimaryColumn()
  @IsUUID('4')
  @Field()
  public id: string;

  @ManyToMany(() => STRSettlementTransaction, (st) => st.movements)
  @Field(() => [STRSettlementTransaction])
  public settlementTransactions?: STRSettlementTransaction[];

  @Column()
  @IsString()
  @Field(() => MovementType)
  public movementType: MovementType;

  @Column()
  @IsString()
  @Field()
  public senderAccountNumber: string;

  @Column()
  @IsString()
  @Field()
  public receiverAccountNumber: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  public paymentReference?: string;
}

@InputType()
export class CreateMovementInput extends OmitType(
  Movement,
  ['settlementTransactions'],
  InputType,
) {}
