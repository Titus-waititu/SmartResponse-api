import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JWTPayload } from '../types';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //Bearer token extraction from Authorization header
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'), //Access token secret key
    });
  }

  validate(payload: JWTPayload) {
    return payload; // Return the payload directly, which contains user information (attach request.user = payload;)
  }
}
