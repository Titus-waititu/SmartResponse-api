import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Create notification (Admin/Officer/Emergency Responder)',
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @Roles(
    UserRole.USER,
    UserRole.ADMIN,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
  )
  @ApiOperation({ summary: 'Get all notifications (All authenticated users)' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.USER,
    UserRole.ADMIN,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
  )
  @ApiOperation({ summary: 'Get notification by ID (All authenticated users)' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Update notification (Admin/Officer/Emergency Responder)',
  })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete notification (Admin only)' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
