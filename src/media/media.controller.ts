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
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Media')
@Controller('media')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Roles(
    UserRole.USER,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Upload media (All authenticated users)' })
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get all media (Admin/Officer)' })
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get media by ID (Admin/Officer/Emergency Responder)',
  })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update media (Admin only)' })
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete media (Admin only)' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
