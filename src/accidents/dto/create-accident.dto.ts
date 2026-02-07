import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccidentSeverity, AccidentStatus } from '../entities/accident.entity';

export class CreateAccidentDto {
  @ApiProperty({ example: 'Two vehicle collision at intersection' })
  @IsString()
  description: string;

  @ApiProperty({ enum: AccidentSeverity, example: AccidentSeverity.MODERATE })
  @IsEnum(AccidentSeverity)
  severity: AccidentSeverity;

  @ApiProperty({
    enum: AccidentStatus,
    required: false,
    example: AccidentStatus.REPORTED,
  })
  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;

  @ApiProperty({ example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -74.006 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: '123 Main St, New York, NY' })
  @IsString()
  locationAddress: string;

  @ApiProperty({ example: '2026-01-29T10:30:00Z' })
  @IsDateString()
  accidentDate: Date;

  @ApiProperty({ required: false, example: 'Clear' })
  @IsOptional()
  @IsString()
  weatherConditions?: string;

  @ApiProperty({ required: false, example: 'Dry' })
  @IsOptional()
  @IsString()
  roadConditions?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  numberOfVehicles?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  numberOfInjuries?: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  numberOfFatalities?: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  reportedById: string;
}
