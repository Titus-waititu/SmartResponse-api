import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { Accident, AccidentStatus } from './entities/accident.entity';

@Injectable()
export class AccidentsService {
  constructor(
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
  ) {}

  async create(createAccidentDto: CreateAccidentDto): Promise<Accident> {
    const reportNumber = this.generateReportNumber();
    const accident = this.accidentRepository.create({
      ...createAccidentDto,
      reportNumber,
    });
    return await this.accidentRepository.save(accident);
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

  private generateReportNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ACC-${year}${month}${day}-${random}`;
  }
}
