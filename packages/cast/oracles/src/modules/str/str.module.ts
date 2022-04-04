import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementTransactionService } from './str.service';
import { SettlementTransactionCensor } from './str.censor';
import { SettlementTransactionResolver } from './str.resolver';
import { Movement, STRSettlementTransaction } from '@castframework/models';

@Module({
  imports: [TypeOrmModule.forFeature([STRSettlementTransaction, Movement])],
  providers: [
    SettlementTransactionService,
    SettlementTransactionCensor,
    SettlementTransactionResolver,
  ],
  exports: [SettlementTransactionService],
})
export class STRModule {}
