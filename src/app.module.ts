import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AccidentReportsModule } from './accident-reports/accident-reports.module';
import { ResponsesModule } from './responses/responses.module';
import { MediaModule } from './media/media.module';
import { InsuranceClaimsModule } from './insurance-claims/insurance-claims.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DatabaseModule,
    AccidentReportsModule,
    ResponsesModule,
    MediaModule,
    InsuranceClaimsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
