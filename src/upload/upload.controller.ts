import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @Roles(
    UserRole.USER,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
    UserRole.ADMIN,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        accidentId: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { accidentId?: string; description?: string },
  ) {
    const result = await this.uploadService.uploadFile(file);
    return {
      ...result,
      accidentId: body.accidentId,
      description: body.description,
    };
  }

  @Post('files')
  @Roles(
    UserRole.USER,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
    UserRole.ADMIN,
  )
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        accidentId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { accidentId?: string },
  ) {
    const uploadedFiles = await Promise.all(
      files.map((file) => this.uploadService.uploadFile(file)),
    );

    return {
      accidentId: body.accidentId,
      files: uploadedFiles,
      count: uploadedFiles.length,
    };
  }

  @Post('document')
  @Roles(UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload accident document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        accidentId: { type: 'string' },
        documentType: {
          type: 'string',
          enum: ['police_report', 'insurance', 'medical', 'other'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { accidentId?: string; documentType?: string },
  ) {
    const result = await this.uploadService.uploadFile(file);
    return {
      ...result,
      accidentId: body.accidentId,
      documentType: body.documentType,
    };
  }

  @Post('video')
  @Roles(
    UserRole.USER,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
    UserRole.ADMIN,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload video evidence' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        accidentId: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Video uploaded successfully',
  })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { accidentId?: string; description?: string },
  ) {
    const result = await this.uploadService.uploadFile(file);
    return {
      ...result,
      accidentId: body.accidentId,
      description: body.description,
      type: 'video',
    };
  }

  @Get('status/:uploadId')
  @Roles(
    UserRole.USER,
    UserRole.OFFICER,
    UserRole.EMERGENCY_RESPONDER,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get upload status' })
  @ApiResponse({
    status: 200,
    description: 'Upload status retrieved successfully',
  })
  getUploadStatus(@Param('uploadId') uploadId: string) {
    return {
      uploadId,
      status: 'completed',
      progress: 100,
      uploadedAt: new Date(),
    };
  }

  @Delete('file/:publicId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Delete uploaded file from Cloudinary' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  async deleteFile(@Param('publicId') publicId: string) {
    // Decode the publicId if it was URL encoded
    const decodedPublicId = decodeURIComponent(publicId);
    await this.uploadService.deleteFile(decodedPublicId);
    return {
      message: 'File deleted successfully',
      publicId: decodedPublicId,
    };
  }
}
