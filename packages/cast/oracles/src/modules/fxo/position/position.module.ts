import { Module } from '@nestjs/common';
import { PositionService } from './position.service';
import { PositionResolver } from './position.resolver';

@Module({
  providers: [PositionService, PositionResolver],
  exports: [PositionService],
})
export class PositionModule {}
