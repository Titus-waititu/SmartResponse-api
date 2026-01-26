import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { UserRole } from 'src/types';
import { GoogleUser } from 'src/types/interfaces';

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
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;

    if (!emails || !emails[0]) {
      return done(new Error('No email found in profile'), undefined);
    }

    // Check if user already exists in DB
    let user = await this.userRepository.findOne({
      where: [{ email: emails[0].value }],
    });

    // Create user if doesn't exist
    if (!user) {
      const imageUrl = photos?.[0]?.value;
      user = this.userRepository.create({
        email: emails[0].value,
        username: name?.givenName || name?.familyName || 'User',
        role: UserRole.REPORTER,
        ...(imageUrl && { image_url: imageUrl }),
      });
      await this.userRepository.save(user);
    }

    const googleUser: GoogleUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    done(null, googleUser);
  }
}
