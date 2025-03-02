import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/db-auth';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (key: keyof User, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();

    return key ? req.user[key] : req.user;
  },
);
