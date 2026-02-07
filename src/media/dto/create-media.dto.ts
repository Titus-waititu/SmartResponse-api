import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../entities/media.entity';

export class CreateMediaDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  accidentId: string;

  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({ example: 'accident_photo_1.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'https://cloudinary.com/example.jpg' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 1048576 })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ required: false, example: 'Front view of vehicle damage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  uploadedById: string;
}
