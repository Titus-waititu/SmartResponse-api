import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ResponseStatus } from '../entities/response.entity';

export class UpdateResponseDto {
  @IsEnum(ResponseStatus)
  @IsOptional()
  status?: ResponseStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimated_arrival_minutes?: number;
}
