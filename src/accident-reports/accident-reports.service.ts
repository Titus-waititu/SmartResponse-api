import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccidentReport,
  AccidentStatus,
  AccidentSeverity,
} from './entities/accident-report.entity';
import { CreateAccidentReportDto } from './dto/create-accident-report.dto';
import { UpdateAccidentReportDto } from './dto/update-accident-report.dto';
import { User } from 'src/users/entities/user.entity';
import type { AccidentReportStatistics } from 'src/types/interfaces';

@Injectable()
export class AccidentReportsService {
  constructor(
    @InjectRepository(AccidentReport)
    private accidentReportRepository: Repository<AccidentReport>,
  ) {}

  async create(
    createAccidentReportDto: CreateAccidentReportDto,
    reporterId: string,
  ): Promise<AccidentReport> {
    try {
      const newReport = this.accidentReportRepository.create({
        ...createAccidentReportDto,
        reporter: { id: reporterId } as Partial<User>,
      });
      return await this.accidentReportRepository.save(newReport);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Error creating accident report: ' + message);
    }
  }

  async findAll(
    status?: AccidentStatus,
    severity?: AccidentSeverity,
  ): Promise<AccidentReport[]> {
    const query = this.accidentReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.responses', 'responses')
      .leftJoinAndSelect('report.media', 'media')
      .orderBy('report.reported_at', 'DESC');

    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    if (severity) {
      query.andWhere('report.severity = :severity', { severity });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<AccidentReport> {
    const report = await this.accidentReportRepository.findOne({
      where: { id },
      relations: [
        'reporter',
        'responses',
        'responses.responder',
        'media',
        'insurance_claims',
      ],
    });

    if (!report) {
      throw new Error(`Accident report with ID ${id} not found`);
    }

    return report;
  }

  async findByReporter(reporterId: string): Promise<AccidentReport[]> {
    return await this.accidentReportRepository.find({
      where: { reporter: { id: reporterId } },
      relations: ['responses', 'media'],
      order: { reported_at: 'DESC' },
    });
  }

  async findNearbyReports(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ): Promise<AccidentReport[]> {
    return await this.accidentReportRepository
      .createQueryBuilder('report')
      .where(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(report.latitude)) *
            cos(radians(report.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(report.latitude))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .andWhere('report.status != :status', { status: AccidentStatus.CLOSED })
      .orderBy('report.reported_at', 'DESC')
      .getMany();
  }

  async update(
    id: string,
    updateAccidentReportDto: UpdateAccidentReportDto,
  ): Promise<AccidentReport> {
    await this.findOne(id);

    const updateData: UpdateAccidentReportDto & { resolved_at?: Date } = {
      ...updateAccidentReportDto,
    };

    if (
      updateAccidentReportDto.status === AccidentStatus.RESOLVED ||
      updateAccidentReportDto.status === AccidentStatus.CLOSED
    ) {
      updateData.resolved_at = new Date();
    }

    await this.accidentReportRepository.update(id, updateData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.accidentReportRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Accident report with ID ${id} not found`);
    }
    return { message: `Accident report with ID ${id} successfully deleted` };
  }

  async getStatistics(): Promise<AccidentReportStatistics> {
    const [
      totalReports,
      activeReports,
      resolvedReports,
      criticalReports,
      severeReports,
      moderateReports,
      minorReports,
      totalVehicles,
      totalInjuries,
      totalFatalities,
    ] = await Promise.all([
      this.accidentReportRepository.count(),
      this.accidentReportRepository.count({
        where: [
          { status: AccidentStatus.REPORTED },
          { status: AccidentStatus.RESPONDERS_DISPATCHED },
          { status: AccidentStatus.ON_SCENE },
        ],
      }),
      this.accidentReportRepository.count({
        where: { status: AccidentStatus.RESOLVED },
      }),
      this.accidentReportRepository.count({
        where: { severity: AccidentSeverity.CRITICAL },
      }),
      this.accidentReportRepository.count({
        where: { severity: AccidentSeverity.SEVERE },
      }),
      this.accidentReportRepository.count({
        where: { severity: AccidentSeverity.MODERATE },
      }),
      this.accidentReportRepository.count({
        where: { severity: AccidentSeverity.MINOR },
      }),
      this.accidentReportRepository
        .createQueryBuilder('report')
        .select('SUM(report.vehicles_involved)', 'total')
        .getRawOne<import('src/types/interfaces').QueryResult>()
        .then((result) => parseInt(result?.total || '0') || 0),
      this.accidentReportRepository
        .createQueryBuilder('report')
        .select('SUM(report.injuries_reported)', 'total')
        .getRawOne<import('src/types/interfaces').QueryResult>()
        .then((result) => parseInt(result?.total || '0') || 0),
      this.accidentReportRepository
        .createQueryBuilder('report')
        .select('SUM(report.fatalities)', 'total')
        .getRawOne<import('src/types/interfaces').QueryResult>()
        .then((result) => parseInt(result?.total || '0') || 0),
    ]);

    return {
      totalReports,
      activeReports,
      resolvedReports,
      closedReports: totalReports - activeReports - resolvedReports,
      severityBreakdown: {
        critical: criticalReports,
        severe: severeReports,
        moderate: moderateReports,
        minor: minorReports,
      },
      totals: {
        vehicles: totalVehicles,
        injuries: totalInjuries,
        fatalities: totalFatalities,
      },
    };
  }
}
