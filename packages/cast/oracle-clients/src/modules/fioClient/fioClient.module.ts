import { Module } from '@nestjs/common';
import { FioClientService } from './fioClient.service';
import { ConfigModule } from '../config/config.module';
import { FioClientConfig } from './fioClient.config';

@Module({
  imports: [ConfigModule.forConfig(FioClientConfig)],
  providers: [FioClientService],
  exports: [FioClientService],
})
export class FioClientModule {}
