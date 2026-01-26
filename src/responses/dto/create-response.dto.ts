import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateResponseDto {
  @IsString()
  @IsNotEmpty()
  accident_report_id: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimated_arrival_minutes?: number;
}
