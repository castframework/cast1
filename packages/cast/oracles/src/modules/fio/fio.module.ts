import { Module } from '@nestjs/common';
import { FIOResolver } from './fio.resolver';
import { ReportService } from './fio.report.service';
import { FioService } from './fio.service';
import { STRClientModule } from '@castframework/oracle-clients';
import { FXOModule } from '../fxo/fxo.module';
import { ConfigModule } from '../config/config.module';
import { FioConfig } from './fio.config';
import { SharedConfig } from '../../shared/shared.config';
import { FxoConfig } from '../fxo/fxo.config';

@Module({
  imports: [
    STRClientModule,
    ConfigModule.forConfig([FxoConfig, FioConfig, SharedConfig]),
    FXOModule,
  ],
  providers: [FIOResolver, ReportService, FioService],
})
export class FIOModule {}
