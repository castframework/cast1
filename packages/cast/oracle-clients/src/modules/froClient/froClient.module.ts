import { Module } from '@nestjs/common';
import { FroClientService } from './froClient.service';
import { ConfigModule } from '../config/config.module';
import { FroClientConfig } from './froClient.config';

@Module({
  imports: [ConfigModule.forConfig(FroClientConfig)],
  providers: [FroClientService],
  exports: [FroClientService],
})
export class FroClientModule {}
