import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { Accident } from './entities/accident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accident])],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
