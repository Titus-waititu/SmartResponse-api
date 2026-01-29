import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!data) return request.user;
    return request.user?.[data];
  },
);
