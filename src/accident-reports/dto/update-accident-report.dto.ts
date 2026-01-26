import { PartialType } from '@nestjs/mapped-types';
import { CreateAccidentReportDto } from './create-accident-report.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AccidentStatus } from '../entities/accident-report.entity';

export class UpdateAccidentReportDto extends PartialType(
  CreateAccidentReportDto,
) {
  @IsEnum(AccidentStatus)
  @IsOptional()
  status?: AccidentStatus;
}
