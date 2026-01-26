import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { MediaType } from '../entities/media.entity';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  file_url: string;

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsEnum(MediaType)
  @IsNotEmpty()
  media_type: MediaType;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  accident_report_id: string;
}
