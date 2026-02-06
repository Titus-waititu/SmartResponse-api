import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'accidents',
  ): Promise<UploadResult> {
    try {
      this.logger.log(`Uploading file: ${file.originalname} to Cloudinary`);

      const resourceType = this.getResourceType(file.mimetype);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            format: this.getFormatFromMimeType(file.mimetype),
          },
          (error, result) => {
            if (error) return reject(error);
            if (result) return resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.secure_url}`);

      return {
        fileUrl: result.secure_url,
        fileName: result.public_id,
        fileSize: result.bytes,
        mimeType: file.mimetype,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Cloudinary', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'accidents',
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from Cloudinary: ${publicId}`);
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error('Error deleting file from Cloudinary', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Get resource type for Cloudinary based on MIME type
   */
  private getResourceType(
    mimeType: string,
  ): 'image' | 'video' | 'raw' | 'auto' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'auto';
  }

  /**
   * Get format from MIME type
   */
  private getFormatFromMimeType(mimeType: string): string | undefined {
    const formatMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/mpeg': 'mpeg',
      'video/quicktime': 'mov',
    };
    return formatMap[mimeType];
  }

  /**
   * Validate file type
   */
  validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Validate file size
   */
  validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Validate and upload file
   */
  async validateAndUpload(file: Express.Multer.File): Promise<UploadResult> {
    const maxSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!this.validateFileType(file, allAllowedTypes)) {
      throw new BadRequestException(
        'Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and videos (MP4, MPEG, MOV) are allowed.',
      );
    }

    const isVideo = file.mimetype.startsWith('video/');
    const maxAllowedSize = isVideo ? maxVideoSize : maxSize;

    if (!this.validateFileSize(file, maxAllowedSize)) {
      throw new BadRequestException(
        `File size exceeds maximum of ${maxAllowedSize / (1024 * 1024)}MB.`,
      );
    }

    return this.uploadFile(file, 'accidents');
  }

  /**
   * Get file extension from mime type
   */
  getFileExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'application/pdf': '.pdf',
    };
    return mimeMap[mimeType] || '';
  }
}
