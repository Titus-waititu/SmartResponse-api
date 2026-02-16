import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ipAddress?: string;

  @ApiProperty()
  userAgent?: string;

  @ApiProperty()
  deviceName?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastActivity: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ActiveSessionsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [SessionResponseDto] })
  sessions: SessionResponseDto[];
}
