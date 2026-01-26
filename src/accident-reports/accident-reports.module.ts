import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccidentReportsService } from './accident-reports.service';
import { AccidentReportsController } from './accident-reports.controller';
import { AccidentReport } from './entities/accident-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccidentReport])],
  controllers: [AccidentReportsController],
  providers: [AccidentReportsService],
  exports: [AccidentReportsService],
})
export class AccidentReportsModule {}
