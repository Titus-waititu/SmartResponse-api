import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media, MediaType } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  async findAll(): Promise<Media[]> {
    return await this.mediaRepository.find({
      relations: ['accident', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ['accident', 'uploadedBy'],
    });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  async findByAccident(accidentId: string): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { accidentId },
      relations: ['uploadedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByType(type: MediaType): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { type },
      relations: ['accident', 'uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    Object.assign(media, updateMediaDto);
    return await this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mediaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
  }
}
