import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'Downtown Emergency Center' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'Main emergency response center' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false, example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, example: '94102' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false, example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
