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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create location (Admin only)' })
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get all locations (Admin/Officer/Emergency Responder)',
  })
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get location by ID (Admin/Officer/Emergency Responder)',
  })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Update location (Admin/Officer)' })
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete location (Admin only)' })
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
