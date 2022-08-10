import { Module } from '@nestjs/common';
import { FXOModule } from '../fxo/fxo.module';
import { DataProviderResolver } from './dataProvider.resolver';
import { DpoService } from './dataProvider.service';

@Module({
  imports: [FXOModule],
  providers: [DataProviderResolver, DpoService],
})
export class DataProviderModule {}
