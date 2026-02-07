import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationPriority,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.ACCIDENT_REPORTED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New Accident Reported' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'An accident has been reported at Main St' })
  @IsString()
  message: string;

  @ApiProperty({
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  accidentId?: string;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
