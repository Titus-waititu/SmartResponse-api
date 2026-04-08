import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import {
  Accident,
  AccidentStatus,
  AccidentSeverity,
} from './entities/accident.entity';
import { AiService } from '../ai/ai.service';
import { UploadService } from '../upload/upload.service';
import { DispatchService } from '../dispatch/dispatch.service';

@Injectable()
export class AccidentsService {
  private readonly logger = new Logger(AccidentsService.name);

  constructor(
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
    private aiService: AiService,
    private uploadService: UploadService,
    private dispatchService: DispatchService,
  ) {}

  async create(createAccidentDto: CreateAccidentDto): Promise<Accident> {
    const reportNumber = this.generateReportNumber();
    const accident = this.accidentRepository.create({
      ...createAccidentDto,
      reportNumber,
    });
    return await this.accidentRepository.save(accident);
  }

  /**
   * Create accident with AI analysis and automatic dispatch
   */
  async createWithAnalysis(
    createAccidentDto: CreateAccidentDto,
    images: Express.Multer.File[],
  ): Promise<{
    accident: Accident;
    aiAnalysis: any;
    dispatchResult: any;
    uploadedImages: any[];
  }> {
    try {
      this.logger.log(
        `Creating accident with AI analysis. Images: ${images?.length || 0}`,
      );

      // 1. Upload and validate images
      const uploadedImages: { fileUrl: string; publicId?: string }[] = [];
      if (images && images.length > 0) {
        for (const image of images) {
          try {
            const uploadResult =
              await this.uploadService.validateAndUpload(image);
            uploadedImages.push(uploadResult);
            this.logger.log(`Image uploaded: ${uploadResult.fileUrl}`);
          } catch (error) {
            this.logger.warn(
              `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }
      }

      this.logger.log(
        `Successfully uploaded ${uploadedImages.length} images for AI analysis`,
      );

      // 2. Analyze severity with AI
      const imageUrls: string[] = uploadedImages.map((img) => img.fileUrl);
      const analysis =
        imageUrls.length > 0
          ? await this.aiService.analyzeAccidentSeverity(imageUrls)
          : await this.aiService.analyzeAccidentSeverity([
              'https://via.placeholder.com/300x200?text=No+Images', // Fallback for testing
            ]);

      this.logger.log(
        `AI Analysis Complete - Severity: ${analysis.severity}, Services: ${analysis.recommendedServices.join(', ')}`,
      );

      // 3. Map AI severity (0-100) to AccidentSeverity enum
      const severity = this.mapSeverityToEnum(analysis.severity);

      // 4. Create accident record
      const reportNumber = this.generateReportNumber();
      const accident = this.accidentRepository.create({
        ...createAccidentDto,
        reportNumber,
        severity,
        status: AccidentStatus.REPORTED,
      });

      const savedAccident = await this.accidentRepository.save(accident);
      this.logger.log(`Accident saved with ID: ${savedAccident.id}`);

      // 5. Auto-dispatch emergency services based on AI analysis
      const dispatchResult =
        await this.dispatchService.dispatchEmergencyServices(
          savedAccident.id,
          createAccidentDto.reportedById || 'system',
          analysis.severity,
          {
            latitude: Number(createAccidentDto.latitude),
            longitude: Number(createAccidentDto.longitude),
          },
          analysis.recommendedServices, // Pass AI-recommended services
        );

      this.logger.log(`Emergency services dispatched. Dispatcher notified`);

      return {
        accident: savedAccident,
        aiAnalysis: analysis,
        dispatchResult,
        uploadedImages,
      };
    } catch (error) {
      this.logger.error(
        `Error in createWithAnalysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * Map AI severity score (0-100) to AccidentSeverity enum
   */
  private mapSeverityToEnum(severityScore: number): AccidentSeverity {
    if (severityScore >= 80) {
      return AccidentSeverity.FATAL;
    } else if (severityScore >= 60) {
      return AccidentSeverity.SEVERE;
    } else if (severityScore >= 30) {
      return AccidentSeverity.MODERATE;
    } else {
      return AccidentSeverity.MINOR;
    }
  }

  private generateReportNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `ACC-${year}-${random}`;
  }

  async findAll(): Promise<Accident[]> {
    return await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .orderBy('accident.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Accident> {
    const accident = await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .where('accident.id = :id', { id })
      .getOne();
    if (!accident) {
      throw new NotFoundException(`Accident with ID ${id} not found`);
    }
    return accident;
  }

  async findByReportNumber(reportNumber: string): Promise<Accident> {
    const accident = await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .where('accident.reportNumber = :reportNumber', { reportNumber })
      .getOne();
    if (!accident) {
      throw new NotFoundException(
        `Accident with report number ${reportNumber} not found`,
      );
    }
    return accident;
  }

  async findByStatus(status: AccidentStatus): Promise<Accident[]> {
    return await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .where('accident.status = :status', { status })
      .orderBy('accident.createdAt', 'DESC')
      .getMany();
  }

  async findByOfficer(officerId: string): Promise<Accident[]> {
    return await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .where('accident.assignedOfficerId = :officerId', { officerId })
      .orderBy('accident.createdAt', 'DESC')
      .getMany();
  }

  async findByUserId(userId: string): Promise<Accident[]> {
    return await this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.reportedBy', 'reportedBy')
      .leftJoinAndSelect('accident.assignedOfficer', 'assignedOfficer')
      .where('accident.reportedById = :userId', { userId })
      .orderBy('accident.createdAt', 'DESC')
      .getMany();
  }

  async update(
    id: string,
    updateAccidentDto: UpdateAccidentDto,
  ): Promise<Accident> {
    const accident = await this.findOne(id);
    Object.assign(accident, updateAccidentDto);
    return await this.accidentRepository.save(accident);
  }

  async assignOfficer(id: string, officerId: string): Promise<Accident> {
    const accident = await this.findOne(id);
    accident.assignedOfficerId = officerId;
    return await this.accidentRepository.save(accident);
  }

  async updateStatus(id: string, status: AccidentStatus): Promise<Accident> {
    const accident = await this.findOne(id);
    accident.status = status;
    return await this.accidentRepository.save(accident);
  }

  async remove(id: string): Promise<void> {
    const result = await this.accidentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Accident with ID ${id} not found`);
    }
  }

  async getStatistics() {
    const total = await this.accidentRepository.count();
    const byStatus = await this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('accident.status')
      .getRawMany();

    const bySeverity = await this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('accident.severity')
      .getRawMany();

    return {
      total,
      byStatus,
      bySeverity,
    };
  }
}
