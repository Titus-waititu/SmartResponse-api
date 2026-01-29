import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return await this.vehicleRepository.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return await this.vehicleRepository.find({
      relations: ['accident'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['accident'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async findByAccident(accidentId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.find({
      where: { accidentId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, updateVehicleDto);
    return await this.vehicleRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
  }
}
