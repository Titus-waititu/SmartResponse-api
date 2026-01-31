import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccidentDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  locationAddress: string;

  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  accidentDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numberOfVehicles?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numberOfInjuries?: number;
}
