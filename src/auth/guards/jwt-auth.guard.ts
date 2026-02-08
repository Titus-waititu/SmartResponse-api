import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Allow unauthenticated access to /metrics endpoint
    const request = context.switchToHttp().getRequest();
    if (request.url === '/metrics' || request.url?.startsWith('/metrics')) {
      return true;
    }

    return super.canActivate(context);
  }
}
