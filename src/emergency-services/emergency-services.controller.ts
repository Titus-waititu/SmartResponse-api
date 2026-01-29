import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmergencyServicesService } from './emergency-services.service';
import { CreateEmergencyServiceDto } from './dto/create-emergency-service.dto';
import { UpdateEmergencyServiceDto } from './dto/update-emergency-service.dto';

@Controller('emergency-services')
export class EmergencyServicesController {
  constructor(
    private readonly emergencyServicesService: EmergencyServicesService,
  ) {}

  @Post()
  create(@Body() createEmergencyServiceDto: CreateEmergencyServiceDto) {
    return this.emergencyServicesService.create(createEmergencyServiceDto);
  }

  @Get()
  findAll() {
    return this.emergencyServicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emergencyServicesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmergencyServiceDto: UpdateEmergencyServiceDto,
  ) {
    return this.emergencyServicesService.update(+id, updateEmergencyServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emergencyServicesService.remove(+id);
  }
}
