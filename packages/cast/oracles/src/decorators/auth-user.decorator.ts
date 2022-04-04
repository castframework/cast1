import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ChainUser } from '../guards/ChainRoles.guard';
import { getRequestFromContext } from '../utils/context';

export const getUserFromRequest = (
  data: unknown,
  ctx: ExecutionContext,
): ChainUser => {
  const request = getRequestFromContext(ctx);
  return request.user;
};

export const AuthUser = createParamDecorator(getUserFromRequest);
