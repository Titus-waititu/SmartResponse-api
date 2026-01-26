import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';

@Controller('responses')
@UseGuards(AtGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @Roles(
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
    UserRole.ADMIN,
  )
  create(@Body() createResponseDto: CreateResponseDto, @Request() req) {
    return this.responsesService.create(createResponseDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.responsesService.findAll();
  }

  @Get('my-responses')
  @Roles(UserRole.POLICE, UserRole.MEDICAL, UserRole.FIRE_DEPARTMENT)
  findMyResponses(@Request() req) {
    return this.responsesService.findByResponder(req.user.sub);
  }

  @Get('my-active-responses')
  @Roles(UserRole.POLICE, UserRole.MEDICAL, UserRole.FIRE_DEPARTMENT)
  getActiveResponses(@Request() req) {
    return this.responsesService.getActiveResponsesByResponder(req.user.sub);
  }

  @Get('accident-report/:accidentReportId')
  findByAccidentReport(@Param('accidentReportId') accidentReportId: string) {
    return this.responsesService.findByAccidentReport(accidentReportId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.responsesService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.POLICE,
    UserRole.MEDICAL,
    UserRole.FIRE_DEPARTMENT,
    UserRole.ADMIN,
  )
  update(
    @Param('id') id: string,
    @Body() updateResponseDto: UpdateResponseDto,
  ) {
    return this.responsesService.update(id, updateResponseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.responsesService.remove(id);
  }
}
