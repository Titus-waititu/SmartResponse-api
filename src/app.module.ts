import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AccidentsModule } from './accidents/accidents.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { MediaModule } from './media/media.module';
import { LocationsModule } from './locations/locations.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmergencyServicesModule } from './emergency-services/emergency-services.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from 'logger.middleware';
import { AiModule } from './ai/ai.module';
import { UploadModule } from './upload/upload.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccidentsModule,
    VehiclesModule,
    MediaModule,
    LocationsModule,
    ReportsModule,
    NotificationsModule,
    EmergencyServicesModule,
    AiModule,
    UploadModule,
    DispatchModule,
   CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          ttl: 60000, // Default TTL for cache entries
          stores: [
            // Memory store for fast local access
            new Keyv({
              store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
            }),
            // Redis store for distributed caching
            createKeyv(configService.getOrThrow<string>('REDIS_URL')),
          ],
        };
      },
    }),
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
