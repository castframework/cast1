import { forwardRef, Module } from '@nestjs/common';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import { FxoSettlementInfoService } from './settlementInfoService.service';
import { STRClientModule } from '@castframework/oracle-clients';
import { FXOResolver } from './fxo.resolver';
import { ConfigModule } from '../config/config.module';
import { FxoConfig } from './fxo.config';
import { SharedConfig } from '../../shared/shared.config';
import { HeartBeatService } from './heartbeat.service';
import { EventService } from './event.service';
import { PositionModule } from './position/position.module';

@Module({
  imports: [
    PositionModule,
    STRClientModule,
    ConfigModule.forConfig([FxoConfig, SharedConfig]),
  ],
  providers: [
    FXOResolver,
    AuthClaimService,
    FxoSettlementInfoService,
    HeartBeatService,
    EventService,
  ],
  exports: [
    FxoSettlementInfoService,
    EventService,
    STRClientModule,
    PositionModule,
  ],
})
export class FXOModule {}
