import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response, ResponseStatus } from './entities/response.entity';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { AccidentReport } from 'src/accident-reports/entities/accident-report.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private responseRepository: Repository<Response>,
  ) {}

  async create(
    createResponseDto: CreateResponseDto,
    responderId: string,
  ): Promise<Response> {
    try {
      const newResponse = this.responseRepository.create({
        ...createResponseDto,
        accident_report: {
          id: createResponseDto.accident_report_id,
        } as Partial<AccidentReport>,
        responder: { id: responderId } as Partial<User>,
        dispatched_at: new Date(),
      });
      return await this.responseRepository.save(newResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Error creating response: ' + message);
    }
  }

  async findAll(): Promise<Response[]> {
    return await this.responseRepository.find({
      relations: ['accident_report', 'responder'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Response> {
    const response = await this.responseRepository.findOne({
      where: { id },
      relations: ['accident_report', 'responder'],
    });

    if (!response) {
      throw new Error(`Response with ID ${id} not found`);
    }

    return response;
  }

  async findByResponder(responderId: string): Promise<Response[]> {
    return await this.responseRepository.find({
      where: { responder: { id: responderId } },
      relations: ['accident_report'],
      order: { created_at: 'DESC' },
    });
  }

  async findByAccidentReport(accidentReportId: string): Promise<Response[]> {
    return await this.responseRepository.find({
      where: { accident_report: { id: accidentReportId } },
      relations: ['responder'],
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: string,
    updateResponseDto: UpdateResponseDto,
  ): Promise<Response> {
    const response = await this.findOne(id);

    const updateData: UpdateResponseDto & {
      arrived_at?: Date;
      completed_at?: Date;
    } = {
      ...updateResponseDto,
    };

    if (
      updateResponseDto.status === ResponseStatus.ON_SCENE &&
      !response.arrived_at
    ) {
      updateData.arrived_at = new Date();
    }

    if (
      updateResponseDto.status === ResponseStatus.COMPLETED &&
      !response.completed_at
    ) {
      updateData.completed_at = new Date();
    }

    await this.responseRepository.update(id, updateData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.responseRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Response with ID ${id} not found`);
    }
    return { message: `Response with ID ${id} successfully deleted` };
  }

  async getActiveResponsesByResponder(
    responderId: string,
  ): Promise<Response[]> {
    return await this.responseRepository.find({
      where: [
        { responder: { id: responderId }, status: ResponseStatus.DISPATCHED },
        { responder: { id: responderId }, status: ResponseStatus.EN_ROUTE },
        { responder: { id: responderId }, status: ResponseStatus.ON_SCENE },
      ],
      relations: ['accident_report'],
      order: { created_at: 'DESC' },
    });
  }
}
