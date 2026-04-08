import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceType } from '../../emergency-services/entities/emergency-service.entity';
import { NotificationPriority } from '../../notifications/entities/notification.entity';

export class SendDispatchDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the incident/accident',
  })
  @IsUUID()
  @IsNotEmpty()
  accidentId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the responder to dispatch',
  })
  @IsUUID()
  @IsNotEmpty()
  responderId: string;

  @ApiProperty({
    enum: ServiceType,
    description: 'Type of emergency service needed',
  })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @ApiProperty({
    example: 85,
    description: 'Incident severity score (0-100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  severity: number;

  @ApiProperty({
    example: 'Multiple vehicle collision at intersection. Potential injuries.',
    description: 'Detailed incident description',
  })
  @IsString()
  @IsNotEmpty()
  incidentDescription: string;

  @ApiProperty({
    example: 'Medical supplies needed. Possible spinal injuries.',
    description: 'Specific instructions for the responder',
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Latitude of incident location',
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Longitude of incident location',
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    example: '123 Main St, City, State 12345',
    description: 'Human-readable address of incident',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Report-2024-001',
    description: 'Incident report number',
  })
  @IsString()
  @IsOptional()
  reportNumber?: string;

  @ApiProperty({
    example: 2,
    description: 'Number of vehicles involved',
  })
  @IsNumber()
  @IsOptional()
  numberOfVehicles?: number;

  @ApiProperty({
    example: 3,
    description: 'Number of injured persons',
  })
  @IsNumber()
  @IsOptional()
  numberOfInjuries?: number;

  @ApiProperty({
    example: 0,
    description: 'Number of fatalities',
  })
  @IsNumber()
  @IsOptional()
  numberOfFatalities?: number;

  @ApiProperty({
    example: 'Rainy',
    description: 'Weather conditions at scene',
  })
  @IsString()
  @IsOptional()
  weatherConditions?: string;

  @ApiProperty({
    example: 'Wet, Low visibility',
    description: 'Road conditions at scene',
  })
  @IsString()
  @IsOptional()
  roadConditions?: string;

  @ApiProperty({
    enum: NotificationPriority,
    default: NotificationPriority.HIGH,
    description: 'Priority level of dispatch',
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    example: [],
    description: 'Additional action items or equipment needs',
  })
  @IsArray()
  @IsOptional()
  actionItems?: string[];
}
