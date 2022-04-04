import { Module } from '@nestjs/common';
import { StrClientService } from './strClient.service';
import { ConfigModule } from '../config/config.module';
import { StrClientConfig } from './strClient.config';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import { SharedConfig } from '../../shared/shared.config';
import { SharedModule } from '../../shared.module';

@Module({
  imports: [
    ConfigModule.forConfig(StrClientConfig),
    ConfigModule.forConfig([SharedConfig]),
    SharedModule,
  ],
  providers: [StrClientService, AuthClaimService],
  exports: [StrClientService],
})
export class STRClientModule {}
