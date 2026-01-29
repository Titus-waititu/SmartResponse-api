import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Parse the database URL and add sslmode=verify-full if it's missing
        const urlWithSsl = databaseUrl?.includes('sslmode=')
          ? databaseUrl
          : databaseUrl
            ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}sslmode=verify-full`
            : undefined;

        return {
          type: 'postgres',
          url: urlWithSsl,
          // host: configService.getOrThrow<string>('DATABASE_HOST', 'localhost'),
          // port: configService.getOrThrow<number>('DATABASE_PORT', 5432),
          // username: configService.getOrThrow<string>('DATABASE_USERNAME'),
          // password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
          // database: configService.getOrThrow<string>('DATABASE_NAME'),
          autoLoadEntities: true,
          synchronize: configService.getOrThrow<boolean>('TYPEORM_SYNC', true),
          logging: configService.getOrThrow<boolean>('TYPEORM_LOGGING', false),
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
