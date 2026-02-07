import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  accidentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  officerId: string;

  @ApiProperty({ example: 'RPT-2026-001' })
  @IsString()
  reportNumber: string;

  @ApiProperty({
    example: 'Detailed investigation of the accident scene revealed...',
  })
  @IsString()
  content: string;

  @ApiProperty({
    required: false,
    example: 'Additional findings and observations',
  })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiProperty({
    required: false,
    example: 'Recommend traffic signal installation',
  })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  submittedAt?: Date;
}
