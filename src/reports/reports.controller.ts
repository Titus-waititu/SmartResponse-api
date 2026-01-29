import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() _createReportDto: CreateReportDto) {
    return this.reportsService.create();
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() _updateReportDto: UpdateReportDto) {
    return this.reportsService.update(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(Number(id));
  }
}
