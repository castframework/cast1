import { Module } from '@nestjs/common';
import { FsoClientService } from './fsoClient.service';
import { ConfigModule } from '../config/config.module';
import { FsoClientConfig } from './fsoClient.config';

@Module({
  imports: [ConfigModule.forConfig(FsoClientConfig)],
  providers: [FsoClientService],
  exports: [FsoClientService],
})
export class FsoClientModule {}
