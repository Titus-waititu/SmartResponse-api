import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccidentReportsService } from './accident-reports.service';
import { CreateAccidentReportDto } from './dto/create-accident-report.dto';
import { UpdateAccidentReportDto } from './dto/update-accident-report.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';
import {
  AccidentStatus,
  AccidentSeverity,
} from './entities/accident-report.entity';

@Controller('accident-reports')
@UseGuards(AtGuard, RolesGuard)
export class AccidentReportsController {
  constructor(
    private readonly accidentReportsService: AccidentReportsService,
  ) {}

  @Post()
  @Roles(UserRole.REPORTER, UserRole.ADMIN)
  create(
    @Body() createAccidentReportDto: CreateAccidentReportDto,
    @Request() req: import('src/types/interfaces').RequestWithUser,
  ) {
    return this.accidentReportsService.create(
      createAccidentReportDto,
      req.user.sub,
    );
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
  )
  findAll(
    @Query('status') status?: AccidentStatus,
    @Query('severity') severity?: AccidentSeverity,
  ) {
    return this.accidentReportsService.findAll(status, severity);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  getStatistics() {
    return this.accidentReportsService.getStatistics();
  }

  @Get('my-reports')
  @Roles(UserRole.REPORTER)
  findMyReports(
    @Request() req: import('src/types/interfaces').RequestWithUser,
  ) {
    return this.accidentReportsService.findByReporter(req.user.sub);
  }

  @Get('nearby')
  @Roles(
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
    UserRole.ADMIN,
  )
  findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.accidentReportsService.findNearbyReports(
      latitude,
      longitude,
      radius,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accidentReportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
  )
  update(
    @Param('id') id: string,
    @Body() updateAccidentReportDto: UpdateAccidentReportDto,
  ) {
    return this.accidentReportsService.update(id, updateAccidentReportDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.accidentReportsService.remove(id);
  }
}
