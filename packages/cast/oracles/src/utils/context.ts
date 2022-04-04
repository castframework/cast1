import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { ExecutionContext } from '@nestjs/common';

export function getRequestFromContextGraphQL(context: ExecutionContext): any {
  const ctx = GqlExecutionContext.create(context);

  return ctx.getContext().req;
}

export function getRequestFromContext(context: ExecutionContext): any {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest();
  } else if (context.getType<GqlContextType>() === 'graphql') {
    return getRequestFromContextGraphQL(context);
  }
}
