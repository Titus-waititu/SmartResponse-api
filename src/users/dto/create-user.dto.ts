import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from 'src/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiPropertyOptional({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone_number: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.REPORTER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  // 📍 Location-based fields
  @ApiPropertyOptional({ description: 'Address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: -74.006 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  // Emergency responder specific fields
  @ApiPropertyOptional({
    description: 'Badge number (for emergency responders)',
    example: 'BADGE-12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badge_number?: string;

  @ApiPropertyOptional({
    description: 'Department name (for emergency responders)',
    example: 'NYPD 5th Precinct',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  department_name?: string;

  @ApiPropertyOptional({
    description: 'Vehicle number (for emergency responders)',
    example: 'UNIT-123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicle_number?: string;

  // Insurance agent specific fields
  @ApiPropertyOptional({
    description: 'Insurance company name (for insurance agents)',
    example: 'State Farm',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  insurance_company?: string;

  @ApiPropertyOptional({
    description: 'License number (for insurance agents)',
    example: 'LIC-789456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  license_number?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Is the user active?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(() => new Date())
  created_at?: Date;

  @IsOptional()
  @Transform(() => new Date())
  updated_at?: Date;
}
