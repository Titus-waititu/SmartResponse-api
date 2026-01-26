import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(
    createMediaDto: CreateMediaDto,
    uploadedById: string,
  ): Promise<Media> {
    try {
      const newMedia = this.mediaRepository.create({
        ...createMediaDto,
        accident_report: { id: createMediaDto.accident_report_id } as any,
        uploaded_by: { id: uploadedById } as any,
      });
      return await this.mediaRepository.save(newMedia);
    } catch (error) {
      throw new Error('Error uploading media: ' + error.message);
    }
  }

  async findByAccidentReport(accidentReportId: string): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { accident_report: { id: accidentReportId } },
      relations: ['uploaded_by'],
      order: { uploaded_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ['accident_report', 'uploaded_by'],
    });

    if (!media) {
      throw new Error(`Media with ID ${id} not found`);
    }

    return media;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.mediaRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Media with ID ${id} not found`);
    }
    return { message: `Media with ID ${id} successfully deleted` };
  }
}
