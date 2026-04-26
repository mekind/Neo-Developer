import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export type AuthenticatedUser = { id: string; createdAt: Date };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser =>
    ctx.switchToHttp().getRequest().user,
);
