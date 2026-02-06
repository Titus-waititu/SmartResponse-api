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
import { EmergencyServicesService } from './emergency-services.service';
import { CreateEmergencyServiceDto } from './dto/create-emergency-service.dto';
import { UpdateEmergencyServiceDto } from './dto/update-emergency-service.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Emergency Services')
@Controller('emergency-services')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class EmergencyServicesController {
  constructor(
    private readonly emergencyServicesService: EmergencyServicesService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create emergency service (Admin only)' })
  create(@Body() createEmergencyServiceDto: CreateEmergencyServiceDto) {
    return this.emergencyServicesService.create(createEmergencyServiceDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get all emergency services (Admin/Officer/Emergency Responder)',
  })
  findAll() {
    return this.emergencyServicesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get emergency service by ID (Admin/Officer/Emergency Responder)',
  })
  findOne(@Param('id') id: string) {
    return this.emergencyServicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Update emergency service (Admin/Emergency Responder)',
  })
  update(
    @Param('id') id: string,
    @Body() updateEmergencyServiceDto: UpdateEmergencyServiceDto,
  ) {
    return this.emergencyServicesService.update(id, updateEmergencyServiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete emergency service (Admin only)' })
  remove(@Param('id') id: string) {
    return this.emergencyServicesService.remove(id);
  }
}
