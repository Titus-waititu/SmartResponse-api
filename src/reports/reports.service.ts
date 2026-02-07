import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    // Check if report number already exists
    const existingReport = await this.reportRepository.findOne({
      where: { reportNumber: createReportDto.reportNumber },
    });

    if (existingReport) {
      throw new NotFoundException(
        `Report with number ${createReportDto.reportNumber} already exists`,
      );
    }

    const report = this.reportRepository.create(createReportDto);
    return await this.reportRepository.save(report);
  }

  async findAll(): Promise<Report[]> {
    return await this.reportRepository.find({
      relations: ['accident', 'officer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['accident', 'officer'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async findByReportNumber(reportNumber: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { reportNumber },
      relations: ['accident', 'officer'],
    });

    if (!report) {
      throw new NotFoundException(
        `Report with number ${reportNumber} not found`,
      );
    }

    return report;
  }

  async findByAccident(accidentId: string): Promise<Report[]> {
    return await this.reportRepository.find({
      where: { accidentId },
      relations: ['officer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOfficer(officerId: string): Promise<Report[]> {
    return await this.reportRepository.find({
      where: { officerId },
      relations: ['accident'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSubmitted(): Promise<Report[]> {
    return await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.accident', 'accident')
      .leftJoinAndSelect('report.officer', 'officer')
      .where('report.submittedAt IS NOT NULL')
      .orderBy('report.submittedAt', 'DESC')
      .getMany();
  }

  async findDraft(): Promise<Report[]> {
    return await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.accident', 'accident')
      .leftJoinAndSelect('report.officer', 'officer')
      .where('report.submittedAt IS NULL')
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);

    // If report number is being updated, check if it already exists
    if (
      updateReportDto.reportNumber &&
      updateReportDto.reportNumber !== report.reportNumber
    ) {
      const existingReport = await this.reportRepository.findOne({
        where: { reportNumber: updateReportDto.reportNumber },
      });

      if (existingReport) {
        throw new NotFoundException(
          `Report with number ${updateReportDto.reportNumber} already exists`,
        );
      }
    }

    Object.assign(report, updateReportDto);
    return await this.reportRepository.save(report);
  }

  async submitReport(id: string): Promise<Report> {
    const report = await this.findOne(id);

    if (report.submittedAt) {
      throw new NotFoundException('Report has already been submitted');
    }

    report.submittedAt = new Date();
    return await this.reportRepository.save(report);
  }

  async remove(id: string): Promise<void> {
    const result = await this.reportRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }

  async getStatistics(): Promise<any> {
    const totalReports = await this.reportRepository.count();
    const submittedReports = await this.reportRepository.count({
      where: { submittedAt: IsNull() },
    });
    const draftReports = totalReports - submittedReports;

    return {
      totalReports,
      submittedReports,
      draftReports,
    };
  }
}
