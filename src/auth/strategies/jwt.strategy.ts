import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/types/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configServices: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configServices.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string } {
    return { userId: payload.sub, email: payload.email };
  }
}
