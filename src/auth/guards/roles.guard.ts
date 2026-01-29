import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { JWTPayload, UserRole } from '../types';

interface UserRequest extends Request {
  user?: JWTPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = await this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    const userRole = user.role;

    this.logger.debug(`User role: ${userRole} (Type: ${typeof userRole})`);
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

    if (!userRole) {
      this.logger.warn('No role found in user object');
      return false;
    }

    const hasRole = requiredRoles.some((role) => {
      this.logger.debug(
        `Comparing: "${userRole}" === "${role}" : ${userRole === role}`,
      );
      return userRole === role;
    });

    this.logger.debug(`Has required role: ${hasRole}`);

    return hasRole;
  }
}
