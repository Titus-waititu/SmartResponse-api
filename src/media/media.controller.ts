import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { AtGuard } from 'src/auth/guards/at.guard';

@Controller('media')
@UseGuards(AtGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(
    @Body() createMediaDto: CreateMediaDto,
    @Request() req: import('src/types/interfaces').RequestWithUser,
  ) {
    return this.mediaService.create(createMediaDto, req.user.sub);
  }

  @Get('accident-report/:accidentReportId')
  findByAccidentReport(@Param('accidentReportId') accidentReportId: string) {
    return this.mediaService.findByAccidentReport(accidentReportId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
