import { getLogger, Logger, HandleLogsAndErrors } from '../../utils/logger';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import { arrayToCSV } from '../../utils/serializationTools';
import * as log4js from 'log4js';
import { STRSettlementTransaction } from '@castframework/models';
import { HttpService } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { FxoConfig } from '../fxo/fxo.config';

@Resolver(() => String)
export class FIOResolver {
  private logger: Logger = getLogger(this.constructor.name);
  public constructor(
    private readonly httpService: HttpService,
    private readonly fxoConfig: FxoConfig,
    private readonly authClaimService: AuthClaimService,
  ) {}

  @Query(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async tradesCSV(): Promise<string> {
    const tradeRepoUrl = this.fxoConfig.strGraphQLEndpoint;

    const claim = this.authClaimService.getEthClaim(tradeRepoUrl);

    this.logger.trace(`Bearer ${claim}`);

    const response = await this.httpService
      .get('/trade', {
        headers: {
          authorization: `Bearer ${claim}`,
        },
        baseURL: tradeRepoUrl,
      })
      .toPromise();

    this.logger.trace(`Trade repository response : ${response}`);

    const trades: STRSettlementTransaction[] = response?.data ?? [];

    return arrayToCSV(trades);
  }
}
