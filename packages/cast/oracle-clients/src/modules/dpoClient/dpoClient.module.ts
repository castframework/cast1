import { Module } from '@nestjs/common';
import { DpoClientService as DpoClientService } from './dpoClient.service';
import { ConfigModule } from '../config/config.module';
import { DpoClientConfig } from './dpoClient.config';

@Module({
  imports: [ConfigModule.forConfig(DpoClientConfig)],
  providers: [DpoClientService],
  exports: [DpoClientService],
})
export class DpoClientModule {}
