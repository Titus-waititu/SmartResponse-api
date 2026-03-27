import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '../../emergency-services/entities/emergency-service.entity';

export class AcknowledgeDispatchDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the emergency service record',
  })
  @IsUUID()
  @IsNotEmpty()
  emergencyServiceId: string;

  @ApiProperty({
    example: 'Acknowledged - En route to scene. ETA 5 minutes.',
    description: 'Acknowledgment message from responder',
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class UpdateResponderStatusDto {
  @ApiProperty({
    enum: ServiceStatus,
    description: 'New status of the response',
  })
  @IsEnum(ServiceStatus)
  @IsNotEmpty()
  status: ServiceStatus;

  @ApiProperty({
    example: 'Arrived on scene. Initial assessment underway.',
    description: 'Status update message or notes from responder',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Current latitude of responder (for tracking)',
  })
  @IsOptional()
  currentLatitude?: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Current longitude of responder (for tracking)',
  })
  @IsOptional()
  currentLongitude?: number;
}
