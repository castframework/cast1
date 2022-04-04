import { getLogger, Logger } from '../utils/logger';
import { authenticate } from '@castframework/chain-auth';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getRequestFromContext } from '../utils/context';
import { Ledger } from '@castframework/models';
import { algToChain } from '../utils/authUtils';

export type ChainUser = {
  address: string;
  chain: Ledger;
};

export function formatChainUser(chainUser?: ChainUser) {
  return chainUser ? `address ${chainUser.address}` : 'unknown address';
}

@Injectable()
export class ChainRolesGuard implements CanActivate {
  private logger: Logger = getLogger(this.constructor.name);

  public canActivate(context: ExecutionContext): boolean {
    const request = getRequestFromContext(context);

    return this.authenticateUserFromRequest(request);
  }

  public authenticateUserFromRequest(request: any): boolean {
    const auth = this.getAuthorizationFieldFromRequest(request);

    this.logger.debug(`Authorization header : ${auth}`);

    const token = auth ? auth.split(' ')[1] : undefined;

    if (!token) {
      // No token no auth
      this.logger.error('No token in header');
      return false;
    }

    const authResult = authenticate(token);

    this.logger.debug(
      `User authentification result : ${JSON.stringify(authResult)}`,
    );

    if (authResult.success) {
      const user: ChainUser = {
        address: authResult.address,
        chain: algToChain(authResult.jws.header.alg),
      };

      request.user = user; // la request est mutable

      this.logger.debug(
        `User "${JSON.stringify(user)}" has been authenticated`,
      );
      return true;
    }

    this.logger.error(authResult.errorMessage);
    return false;
  }

  public getAuthorizationFieldFromRequest(request: any): any {
    return request.headers.authorization;
  }
}
