import { Injectable, NotFoundException } from '@nestjs/common';
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
    dispatchResult: any;
    uploadedImages: any[];
  }> {
    // 1. Upload and validate images
    const uploadedImages: any[] = [];
    for (const image of images || []) {
      const uploadResult = await this.uploadService.validateAndUpload(image);
      uploadedImages.push(uploadResult);
    }

    // 2. Analyze severity with AI
    const imageUrls = uploadedImages.map((img) => img.fileUrl);
    const analysis = await this.aiService.analyzeAccidentSeverity(imageUrls);

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

    // 5. Auto-dispatch emergency services based on AI analysis
    const dispatchResult = await this.dispatchService.dispatchEmergencyServices(
      savedAccident.id,
      createAccidentDto.userId || 'system',
      analysis.severity,
      {
        latitude: Number(createAccidentDto.latitude),
        longitude: Number(createAccidentDto.longitude),
      },
    );

    return {
      accident: savedAccident,
      dispatchResult,
      uploadedImages,
    };
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
    return await this.accidentRepository.find({
      relations: ['reportedBy', 'assignedOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Accident> {
    const accident = await this.accidentRepository.findOne({
      where: { id },
      relations: ['reportedBy', 'assignedOfficer'],
    });
    if (!accident) {
      throw new NotFoundException(`Accident with ID ${id} not found`);
    }
    return accident;
  }

  async findByReportNumber(reportNumber: string): Promise<Accident> {
    const accident = await this.accidentRepository.findOne({
      where: { reportNumber },
      relations: ['reportedBy', 'assignedOfficer'],
    });
    if (!accident) {
      throw new NotFoundException(
        `Accident with report number ${reportNumber} not found`,
      );
    }
    return accident;
  }

  async findByStatus(status: AccidentStatus): Promise<Accident[]> {
    return await this.accidentRepository.find({
      where: { status },
      relations: ['reportedBy', 'assignedOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOfficer(officerId: string): Promise<Accident[]> {
    return await this.accidentRepository.find({
      where: { assignedOfficerId: officerId },
      relations: ['reportedBy', 'assignedOfficer'],
      order: { createdAt: 'DESC' },
    });
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
