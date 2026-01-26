import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { AccidentSeverity } from '../entities/accident-report.entity';

export class CreateAccidentReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AccidentSeverity)
  @IsNotEmpty()
  severity: AccidentSeverity;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  vehicles_involved?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  injuries_reported?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fatalities?: number;

  @IsBoolean()
  @IsOptional()
  emergency_services_notified?: boolean;

  @IsString()
  @IsOptional()
  weather_conditions?: string;

  @IsString()
  @IsOptional()
  road_conditions?: string;

  @IsString()
  @IsOptional()
  additional_notes?: string;
}
