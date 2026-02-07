import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ServiceType,
  ServiceStatus,
} from '../entities/emergency-service.entity';

export class CreateEmergencyServiceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  accidentId: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.AMBULANCE })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({ enum: ServiceStatus, example: ServiceStatus.REQUESTED })
  @IsEnum(ServiceStatus)
  status: ServiceStatus;

  @ApiProperty({ example: 'City Ambulance Service' })
  @IsString()
  serviceProvider: string;

  @ApiProperty({ example: '+1-555-0100' })
  @IsString()
  contactNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dispatchedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  arrivedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  responderId?: string;

  @ApiProperty({
    required: false,
    example: 'Patient transported to Memorial Hospital',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
