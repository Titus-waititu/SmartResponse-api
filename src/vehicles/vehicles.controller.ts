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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register vehicle (User/Officer/Admin)' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get all vehicles (Admin/Officer)' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('accident/:accidentId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get vehicles by accident ID' })
  findByAccident(@Param('accidentId') accidentId: string) {
    return this.vehiclesService.findByAccident(accidentId);
  }

  @Get('plate/:licensePlate')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get vehicle by license plate' })
  findByLicensePlate(@Param('licensePlate') licensePlate: string) {
    return this.vehiclesService.findByLicensePlate(licensePlate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get vehicle by ID (Admin/Officer)' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Update vehicle (Admin/Officer)' })
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle (Admin only)' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
