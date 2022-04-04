import { getLogger, Logger, HandleLogsAndErrors } from '../../../utils/logger';
import { PositionService } from './position.service';
import { Query, Resolver, Args } from '@nestjs/graphql';
import { Ledger, InstrumentPosition } from '@castframework/models';
import { errorAsString } from '../../../utils/errorAsString';
import * as log4js from 'log4js';

@Resolver((of) => String)
export class PositionResolver {
  private logger: Logger = getLogger(this.constructor.name);
  private positionService: PositionService;

  public constructor(positionService: PositionService) {
    this.positionService = positionService;
  }

  @Query((returns) => [InstrumentPosition])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getInstrumentPositions(
    @Args('instrumentAddress') instrumentAddress: string,
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
  ): Promise<InstrumentPosition[]> {
    return await this.positionService.getInstrumentPositions(
      instrumentAddress,
      ledger,
    );
  }

  @Query((returns) => [InstrumentPosition])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getInstrumentPosition(
    @Args('instrumentAddress') instrumentAddress: string,
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
    @Args('legalEntityAddress') legalEntityAddress: string,
  ): Promise<InstrumentPosition[]> {
    const result: InstrumentPosition[] =
      await this.positionService.getInstrumentPositions(
        instrumentAddress,
        ledger,
      );
    const instrumentPosition: InstrumentPosition[] = result.filter(
      (elt) =>
        elt.legalEntityAddress.toLowerCase() ===
        legalEntityAddress.toLowerCase(),
    );
    return instrumentPosition;
  }
}
