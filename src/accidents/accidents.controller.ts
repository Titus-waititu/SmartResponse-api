import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('accidents')
@Controller('accidents')
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create accident report (basic)' })
  create(@Body() createAccidentDto: CreateAccidentDto) {
    return this.accidentsService.create(createAccidentDto);
  }

  @Post('report')
  @Public()
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({
    summary: 'Create accident report with AI analysis and auto-dispatch',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Accident report with images for AI severity analysis',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Accident description' },
        location: { type: 'string', description: 'Accident location' },
        latitude: { type: 'number', description: 'Latitude coordinate' },
        longitude: { type: 'number', description: 'Longitude coordinate' },
        userId: { type: 'string', description: 'User ID (optional)' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Accident scene images (max 10)',
        },
      },
      required: ['description', 'location', 'latitude', 'longitude'],
    },
  })
  async createWithAnalysis(
    @Body() createAccidentDto: CreateAccidentDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.accidentsService.createWithAnalysis(createAccidentDto, images);
  }

  @Get()
  findAll() {
    return this.accidentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accidentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccidentDto: UpdateAccidentDto,
  ) {
    return this.accidentsService.update(id, updateAccidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accidentsService.remove(id);
  }
}
