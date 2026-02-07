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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Create report (Admin/Officer)' })
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get all reports (Admin/Officer/Emergency Responder)',
  })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('report/:reportNumber')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get report by report number' })
  findByReportNumber(@Param('reportNumber') reportNumber: string) {
    return this.reportsService.findByReportNumber(reportNumber);
  }

  @Get('accident/:accidentId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get reports by accident ID' })
  findByAccident(@Param('accidentId') accidentId: string) {
    return this.reportsService.findByAccident(accidentId);
  }

  @Get('officer/:officerId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get reports by officer ID' })
  findByOfficer(@Param('officerId') officerId: string) {
    return this.reportsService.findByOfficer(officerId);
  }

  @Get('submitted')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get all submitted reports' })
  findSubmitted() {
    return this.reportsService.findSubmitted();
  }

  @Get('draft')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get all draft reports' })
  findDraft() {
    return this.reportsService.findDraft();
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get report statistics' })
  getStatistics() {
    return this.reportsService.getStatistics();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get report by ID (Admin/Officer/Emergency Responder)',
  })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Update report (Admin/Officer)' })
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Patch(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Submit report (Admin/Officer)' })
  submitReport(@Param('id') id: string) {
    return this.reportsService.submitReport(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete report (Admin only)' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
