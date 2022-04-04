import { FSOResolver } from './fso.resolver';
import { FsoService } from './fso.service';
import { Module } from '@nestjs/common';
import { STRClientModule } from '@castframework/oracle-clients';
import { FXOModule } from '../fxo/fxo.module';

@Module({
  imports: [STRClientModule, FXOModule],
  providers: [FSOResolver, FsoService],
})
export class FSOModule {}
