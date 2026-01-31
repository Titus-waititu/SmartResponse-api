import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as path from 'path';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Upload file to cloud storage
   * In production, integrate with AWS S3, Azure Blob Storage, or Google Cloud Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'accidents',
  ): Promise<UploadResult> {
    try {
      this.logger.log(`Uploading file: ${file.originalname}`);

      // Generate unique filename
      const fileExt = path.extname(file.originalname);
      const uniqueFileName = `${folder}/${crypto.randomBytes(16).toString('hex')}${fileExt}`;

      // TODO: Implement actual cloud storage upload
      // For AWS S3:
      // await this.s3.upload({ Bucket: 'your-bucket', Key: uniqueFileName, Body: file.buffer }).promise();

      // For Azure Blob Storage:
      // await this.blobServiceClient.getContainerClient('accidents').uploadBlockBlob(uniqueFileName, file.buffer, file.size);

      // Mock URL for now
      const fileUrl = `https://storage.example.com/${uniqueFileName}`;

      return {
        fileUrl,
        fileName: uniqueFileName,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Error uploading file', error);
      throw error;
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
   * Delete file from cloud storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      this.logger.log(`Deleting file: ${fileUrl}`);
      // TODO: Implement actual cloud storage deletion
    } catch (error) {
      this.logger.error('Error deleting file', error);
      throw error;
    }
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!this.validateFileType(file, allowedTypes)) {
      throw new Error('Invalid file type. Only JPEG and PNG are allowed.');
    }

    if (!this.validateFileSize(file, maxSize)) {
      throw new Error('File size exceeds maximum of 10MB.');
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
