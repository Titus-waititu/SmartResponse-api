import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchService } from './dispatch.service';
import { EmergencyService } from '../emergency-services/entities/emergency-service.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyService, Notification])],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
