import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithProvider } from './types/auth.types';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithProvider => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
