import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/db-auth';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (key: keyof User | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return key ? user?.[key] : user;
  },
);
