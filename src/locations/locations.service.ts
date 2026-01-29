import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async findByCity(city: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { city, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<Location[]> {
    return await this.locationRepository
      .createQueryBuilder('location')
      .where('location.is_active = :isActive', { isActive: true })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(latitude))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .getMany();
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    const location = await this.findOne(id);
    Object.assign(location, updateLocationDto);
    return await this.locationRepository.save(location);
  }

  async deactivate(id: string): Promise<Location> {
    const location = await this.findOne(id);
    location.isActive = false;
    return await this.locationRepository.save(location);
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
  }
}
