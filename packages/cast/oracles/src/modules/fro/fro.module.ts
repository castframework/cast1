import { Module } from '@nestjs/common';
import { FROResolver } from './fro.resolver';
import { FroService } from './fro.service';
import { FroRedemptionService } from './fro.redemption.service';
import { STRClientModule } from '@castframework/oracle-clients';
import { FXOModule } from '../fxo/fxo.module';
import { FroOperationService } from './fro.operation.service';

@Module({
  imports: [STRClientModule, FXOModule],
  providers: [
    FroService,
    FroRedemptionService,
    FroOperationService,
    FROResolver,
  ],
})
export class FROModule {}
