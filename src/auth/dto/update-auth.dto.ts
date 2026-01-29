import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './create-auth.dto';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
