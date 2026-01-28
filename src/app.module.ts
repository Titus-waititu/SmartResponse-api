import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';











NODE_ENV=developmentPORT=3000# ApplicationJWT_REFRESH_EXPIRATION=7dJWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-productionJWT_EXPIRATION=15mJWT_SECRET=your-super-secret-jwt-key-change-this-in-production# JWT Configurationimport { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
