import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmergencyServiceDto } from './dto/create-emergency-service.dto';
import { UpdateEmergencyServiceDto } from './dto/update-emergency-service.dto';
import {
  EmergencyService,
  ServiceStatus,
} from './entities/emergency-service.entity';

@Injectable()
export class EmergencyServicesService {
  constructor(
    @InjectRepository(EmergencyService)
    private emergencyServiceRepository: Repository<EmergencyService>,
  ) {}

  async create(
    createEmergencyServiceDto: CreateEmergencyServiceDto,
  ): Promise<EmergencyService> {
    const service = this.emergencyServiceRepository.create(
      createEmergencyServiceDto,
    );
    return await this.emergencyServiceRepository.save(service);
  }

  async findAll(): Promise<EmergencyService[]> {
    return await this.emergencyServiceRepository.find({
      relations: ['accident', 'responder'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EmergencyService> {
    const service = await this.emergencyServiceRepository.findOne({
      where: { id },
      relations: ['accident', 'responder'],
    });
    if (!service) {
      throw new NotFoundException(`Emergency service with ID ${id} not found`);
    }
    return service;
  }

  async findByAccident(accidentId: string): Promise<EmergencyService[]> {
    return await this.emergencyServiceRepository.find({
      where: { accidentId },
      relations: ['responder'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByStatus(status: ServiceStatus): Promise<EmergencyService[]> {
    return await this.emergencyServiceRepository.find({
      where: { status },
      relations: ['accident', 'responder'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByResponder(responderId: string): Promise<EmergencyService[]> {
    return await this.emergencyServiceRepository.find({
      where: { responderId },
      relations: ['accident'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateEmergencyServiceDto: UpdateEmergencyServiceDto,
  ): Promise<EmergencyService> {
    const service = await this.findOne(id);
    Object.assign(service, updateEmergencyServiceDto);
    return await this.emergencyServiceRepository.save(service);
  }

  async updateStatus(
    id: string,
    status: ServiceStatus,
  ): Promise<EmergencyService> {
    const service = await this.findOne(id);
    service.status = status;

    // Set timestamps based on status
    if (status === ServiceStatus.DISPATCHED && !service.dispatchedAt) {
      service.dispatchedAt = new Date();
    } else if (status === ServiceStatus.ON_SCENE && !service.arrivedAt) {
      service.arrivedAt = new Date();
    } else if (status === ServiceStatus.COMPLETED && !service.completedAt) {
      service.completedAt = new Date();
    }

    return await this.emergencyServiceRepository.save(service);
  }

  async assignResponder(
    id: string,
    responderId: string,
  ): Promise<EmergencyService> {
    const service = await this.findOne(id);
    service.responderId = responderId;
    return await this.emergencyServiceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const result = await this.emergencyServiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Emergency service with ID ${id} not found`);
    }
  }

  async getActiveServices(): Promise<EmergencyService[]> {
    return await this.emergencyServiceRepository.find({
      where: [
        { status: ServiceStatus.REQUESTED },
        { status: ServiceStatus.DISPATCHED },
        { status: ServiceStatus.EN_ROUTE },
        { status: ServiceStatus.ON_SCENE },
      ],
      relations: ['accident', 'responder'],
      order: { createdAt: 'ASC' },
    });
  }
}
