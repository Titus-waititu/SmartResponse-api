import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

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
        // Build Redis URL from individual config values or use REDIS_URL directly
        const redisUrl =
          configService.get<string>('REDIS_URL') ||
          `redis://:${configService.get<string>('REDIS_PASSWORD', '')}@${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}`;

        console.log(
          'Cache configuration - Redis URL:',
          redisUrl.replace(/:[^:@]*@/, ':****@'),
        ); // Log with masked password

        return {
          ttl: 60000, // Default TTL for cache entries (60 seconds)
          stores: [
            // Memory store for fast local access
            new Keyv({
              store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
            }),
            // Redis store for distributed caching
            createKeyv(redisUrl),
          ],
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('THROTTLE_TTL', {
            infer: true,
          }) as number,
          limit: configService.getOrThrow<number>('THROTTLE_LIMIT', {
            infer: true,
          }) as number,
          ignoreUserAgents: [/^curl\//, /^PostmanRuntime\//],
        },
      ],
    }),
    PrometheusModule.register({
        defaultMetrics: {
          enabled: true,
        },
        path: '/metrics',
      }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
