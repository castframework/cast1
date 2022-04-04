import { getLogger, Logger } from '../utils/logger';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Ledger } from '@castframework/models';
import { getRequestFromContext } from '../utils/context';
import { ChainUser } from './ChainRoles.guard';

@Injectable()
export class StrFakeGuard implements CanActivate {
  private logger: Logger = getLogger(this.constructor.name);

  public canActivate(context: ExecutionContext): boolean {
    const request = getRequestFromContext(context);

    const user: ChainUser = {
      address: '0x72Ed3255b443f4A89A77e9325F1AD9Aa64C5eb81',
      chain: Ledger.ETHEREUM,
    };

    request.user = user;

    return true;
  }
}
