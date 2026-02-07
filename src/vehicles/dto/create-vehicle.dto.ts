import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  accidentId: string;

  @ApiProperty({ example: 'ABC123' })
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  model: string;

  @ApiProperty({ required: false, example: 2020 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({ required: false, example: 'Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  driverName: string;

  @ApiProperty({ required: false, example: 'D1234567' })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiProperty({ required: false, example: 'State Farm' })
  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @ApiProperty({ required: false, example: 'POL123456' })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @ApiProperty({ required: false, example: 'Front bumper damaged' })
  @IsOptional()
  @IsString()
  damage?: string;
}
