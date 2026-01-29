import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
