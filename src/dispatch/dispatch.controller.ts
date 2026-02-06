import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmergencyService,
  ServiceStatus,
} from '../emergency-services/entities/emergency-service.entity';

class ManualDispatchDto {
  accidentId: string;
  userId: string;
  severity: number;
  latitude: number;
  longitude: number;
}

@ApiTags('Dispatch')
@Controller('dispatch')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class DispatchController {
  constructor(
    private readonly dispatchService: DispatchService,
    @InjectRepository(EmergencyService)
    private readonly emergencyServiceRepo: Repository<EmergencyService>,
  ) {}

  @Post('manual')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Manually dispatch emergency services' })
  @ApiBody({ type: ManualDispatchDto })
  @ApiResponse({
    status: 201,
    description: 'Emergency services dispatched successfully',
  })
  async manualDispatch(@Body() dispatchDto: ManualDispatchDto) {
    return this.dispatchService.dispatchEmergencyServices(
      dispatchDto.accidentId,
      dispatchDto.userId,
      dispatchDto.severity,
      {
        latitude: dispatchDto.latitude,
        longitude: dispatchDto.longitude,
      },
    );
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get all active dispatches' })
  @ApiResponse({
    status: 200,
    description: 'Active dispatches retrieved successfully',
  })
  async getActiveDispatches() {
    return this.emergencyServiceRepo.find({
      where: {
        status: ServiceStatus.DISPATCHED,
      },
      order: {
        dispatchedAt: 'DESC',
      },
      take: 50,
    });
  }

  @Get('accident/:accidentId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get dispatches for a specific accident' })
  @ApiResponse({
    status: 200,
    description: 'Accident dispatches retrieved successfully',
  })
  async getDispatchesByAccident(
    @Param('accidentId', ParseUUIDPipe) accidentId: string,
  ) {
    return this.emergencyServiceRepo.find({
      where: {
        accidentId,
      },
      order: {
        dispatchedAt: 'DESC',
      },
    });
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get all pending dispatches' })
  @ApiResponse({
    status: 200,
    description: 'Pending dispatches retrieved successfully',
  })
  async getPendingDispatches() {
    return this.emergencyServiceRepo.find({
      where: [
        { status: ServiceStatus.DISPATCHED },
        { status: ServiceStatus.EN_ROUTE },
      ],
      order: {
        dispatchedAt: 'DESC',
      },
    });
  }

  @Get('completed')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get completed dispatches' })
  @ApiResponse({
    status: 200,
    description: 'Completed dispatches retrieved successfully',
  })
  async getCompletedDispatches() {
    return this.emergencyServiceRepo.find({
      where: [
        { status: ServiceStatus.ON_SCENE },
        { status: ServiceStatus.COMPLETED },
      ],
      order: {
        arrivedAt: 'DESC',
      },
      take: 100,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @ApiOperation({ summary: 'Get dispatch statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch statistics retrieved successfully',
  })
  async getDispatchStatistics() {
    const [active, completed, total] = await Promise.all([
      this.emergencyServiceRepo.count({
        where: [
          { status: ServiceStatus.DISPATCHED },
          { status: ServiceStatus.EN_ROUTE },
        ],
      }),
      this.emergencyServiceRepo.count({
        where: [
          { status: ServiceStatus.ON_SCENE },
          { status: ServiceStatus.COMPLETED },
        ],
      }),
      this.emergencyServiceRepo.count(),
    ]);

    return {
      active,
      completed,
      total,
      avgResponseTime: null, // TODO: Calculate based on actual data
    };
  }
}
