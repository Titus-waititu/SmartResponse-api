import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';
import { Accident } from './entities/accident.entity';
import { AiModule } from '../ai/ai.module';
import { UploadModule } from '../upload/upload.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Accident]),
    AiModule,
    UploadModule,
    DispatchModule,
  ],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
