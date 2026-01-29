import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyServicesService } from './emergency-services.service';
import { EmergencyServicesController } from './emergency-services.controller';
import { EmergencyService } from './entities/emergency-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyService])],
  controllers: [EmergencyServicesController],
  providers: [EmergencyServicesService],
  exports: [EmergencyServicesService],
})
export class EmergencyServicesModule {}
