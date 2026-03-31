import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { UserRole } from '../types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      name: { givenName?: string; familyName?: string };
      emails: { value: string }[];
      photos: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    // Check if user already exists in DB
    let user = await this.userRepository.findOne({
      where: [{ email: emails[0].value }],
    });

    // Create user if doesn't exist
    if (!user) {
      const fullName =
        `${name.givenName || ''} ${name.familyName || ''}`.trim() ||
        'Google User';
      const username = emails[0].value.split('@')[0] || 'googleuser';

      user = this.userRepository.create({
        fullName,
        email: emails[0].value,
        username,
        password: await this.generateRandomPassword(), // Generate a random password for OAuth users
        role: UserRole.USER, // Default role for new OAuth users
        image_url: photos[0]?.value,
        isActive: true,
      });
      await this.userRepository.save(user);
    }

    done(null, {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      image_url: photos[0]?.value,
      providerId: id,
      provider: 'google',
    });
  }

  private async generateRandomPassword(): Promise<string> {
    // Generate a random password for OAuth users who won't use traditional login
    const crypto = await import('crypto');
    return crypto.randomBytes(16).toString('hex');
  }
}
