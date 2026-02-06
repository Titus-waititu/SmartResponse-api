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
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('accidents')
@Controller('accidents')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.OFFICER, UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get all accidents (Admin/Officer/Emergency Responder)',
  })
  findAll() {
    return this.accidentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get accident by ID (Admin/Officer/Emergency Responder)',
  })
  findOne(@Param('id') id: string) {
    return this.accidentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Update accident (Admin/Officer)' })
  update(
    @Param('id') id: string,
    @Body() updateAccidentDto: UpdateAccidentDto,
  ) {
    return this.accidentsService.update(id, updateAccidentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete accident (Admin only)' })
  remove(@Param('id') id: string) {
    return this.accidentsService.remove(id);
  }
}
