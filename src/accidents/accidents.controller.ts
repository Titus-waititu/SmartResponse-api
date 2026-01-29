import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';

@Controller('accidents')
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  create(@Body() createAccidentDto: CreateAccidentDto) {
    return this.accidentsService.create(createAccidentDto);
  }

  @Get()
  findAll() {
    return this.accidentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accidentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccidentDto: UpdateAccidentDto,
  ) {
    return this.accidentsService.update(+id, updateAccidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accidentsService.remove(+id);
  }
}
