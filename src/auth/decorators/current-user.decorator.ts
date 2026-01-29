import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as { user: any };
    if (!data) return request.user as any;
    return request.user?.[data] as any;
  },
);
