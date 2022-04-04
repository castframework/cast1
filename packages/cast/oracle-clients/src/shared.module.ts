import { Module, Global } from '@nestjs/common';
import { AuthClaimService } from './shared/services/authClaim.service';
import { ConfigModule } from './modules/config/config.module';
import { SharedConfig } from './shared/shared.config';
const providers = [AuthClaimService];

const imports = [];

@Global()
@Module({
  providers,
  imports: [...imports, ConfigModule.forConfig([SharedConfig])],
  exports: [...providers, ...imports],
})
export class SharedModule {}
