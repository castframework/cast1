import {
  ForgeBondAllEvents,
  FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
} from '@castframework/cast-interface-v1';
import { Injectable } from '@nestjs/common/';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import { bnToUuid, collapseToBigNumber } from '../../utils/bigNumberUtils';
import { getLogger, Logger } from '../../utils/logger';
import { EventService } from '../fxo/event.service';
import { StrClientService } from '@castframework/oracle-clients';

@Injectable()
export class FioService {
  private logger: Logger = getLogger(this.constructor.name);
  public constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthClaimService,

    private readonly strClientService: StrClientService,
  ) {}
  public onModuleInit(): void {
    this.eventService.addInstrumentEventHandler(
      FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
      async (event: ForgeBondAllEvents): Promise<void> => {
        if (event.eventName === FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED) {
          const settlementTransactionId = bnToUuid(
            collapseToBigNumber(event.payload.settlementTransactionId),
          );

          const transaction =
            await this.strClientService.getSettlementTransaction(
              settlementTransactionId,
            );

          if (!transaction) {
            this.logger.debug(
              `Unable to get details for transaction [${settlementTransactionId}]. Ignoring`,
            );
            return;
          }
        } else {
          this.logger.error('Wrong event type, this is not supose to happen');
        }
      },
    );
  }
}
