import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Patch,
  NotFoundException,
  BadRequestException,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmergencyService,
  ServiceStatus,
} from '../emergency-services/entities/emergency-service.entity';
import { SendDispatchDto } from './dto/send-dispatch.dto';
import {
  AcknowledgeDispatchDto,
  UpdateResponderStatusDto,
} from './dto/responder-action.dto';
import { ApiProperty } from '@nestjs/swagger';

class ManualDispatchDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  accidentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 75, description: 'Severity score (0-100)' })
  severity: number;

  @ApiProperty({ example: 37.7749 })
  latitude: number;

  @ApiProperty({ example: -122.4194 })
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
  @Roles(UserRole.ADMIN,UserRole.DISPATCHER, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER, UserRole.DISPATCHER)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER, UserRole.DISPATCHER)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER, UserRole.DISPATCHER)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER, UserRole.DISPATCHER)
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
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.DISPATCHER)
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

  // ============================================
  // DISPATCHER-TO-RESPONDER COMMUNICATION ENDPOINTS
  // ============================================

  @Post('send-to-responder')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.OFFICER)
  @ApiOperation({
    summary: 'Send dispatch instruction to a specific responder',
    description:
      'Dispatcher sends detailed incident information to a specific responder. Responder receives notification with full incident details.',
  })
  @ApiBody({ type: SendDispatchDto })
  @ApiResponse({
    status: 201,
    description: 'Dispatch sent to responder successfully',
  })
  async sendDispatchToResponder(@Body() sendDispatchDto: SendDispatchDto) {
    try {
      const result = await this.dispatchService.sendDispatchToResponder(
        sendDispatchDto.accidentId,
        sendDispatchDto.responderId,
        sendDispatchDto.serviceType,
        sendDispatchDto.severity,
        sendDispatchDto.incidentDescription,
        {
          latitude: sendDispatchDto.latitude,
          longitude: sendDispatchDto.longitude,
        },
        {
          address: sendDispatchDto.address,
          reportNumber: sendDispatchDto.reportNumber,
          numberOfVehicles: sendDispatchDto.numberOfVehicles,
          numberOfInjuries: sendDispatchDto.numberOfInjuries,
          numberOfFatalities: sendDispatchDto.numberOfFatalities,
          weatherConditions: sendDispatchDto.weatherConditions,
          roadConditions: sendDispatchDto.roadConditions,
          actionItems: sendDispatchDto.actionItems,
          instructions: sendDispatchDto.instructions,
        },
      );

      return {
        success: true,
        data: result,
        message: 'Dispatch sent to responder successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to send dispatch: ${error.message}`,
      );
    }
  }

  @Get('dispatcher/active')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.OFFICER)
  @ApiOperation({
    summary: "Get all active dispatches for dispatcher's management",
    description:
      'Retrieves all active (pending, en-route, on-scene) dispatches that dispatcher is managing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active dispatches retrieved successfully',
  })
  async getDispatcherActiveDispatches() {
    return this.dispatchService.getActiveDispatchesForDispatcher();
  }

  // ============================================
  // RESPONDER-SPECIFIC ENDPOINTS
  // ============================================

  @Get('my-assignments')
  @Roles(UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get my assigned incidents',
    description:
      'Responder retrieves all incidents they have been assigned to. Shows pending, en-route, and on-scene incidents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Responder assignments retrieved successfully',
  })
  async getMyAssignments(@CurrentUser('sub') responderId: string) {
    return this.dispatchService.getResponderAssignments(responderId, false);
  }

  @Get('my-assignments/history')
  @Roles(UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Get my incident history (including completed)',
    description:
      'Responder retrieves all incidents including completed and cancelled assignments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Responder assignment history retrieved successfully',
  })
  async getMyAssignmentHistory(@CurrentUser('sub') responderId: string) {
    return this.dispatchService.getResponderAssignments(responderId, true);
  }

  @Get(':emergencyServiceId/details')
  @Roles(UserRole.EMERGENCY_RESPONDER, UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({
    summary: 'Get detailed information about a dispatch',
    description:
      'Get full incident details including location, severity, injuries, weather conditions, and specific instructions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispatch details retrieved successfully',
  })
  async getDispatchDetails(
    @Param('emergencyServiceId', ParseUUIDPipe) emergencyServiceId: string,
    @CurrentUser('sub') userId: string,
  ) {
    try {
      // Allow dispatcher/admin to view any dispatch, responders only their own
      const userRole = 'user'; // In real app, get from token

      const dispatch = await this.emergencyServiceRepo.findOne({
        where: { id: emergencyServiceId },
        relations: ['accident', 'responder'],
      });

      if (!dispatch) {
        throw new NotFoundException('Dispatch not found');
      }

      return dispatch;
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve dispatch details: ${error.message}`,
      );
    }
  }

  @Post(':emergencyServiceId/acknowledge')
  @Roles(UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Acknowledge dispatch and confirm response',
    description:
      'Responder confirms receipt of dispatch and indicates they are en-route to the scene.',
  })
  @ApiBody({ type: AcknowledgeDispatchDto })
  @ApiResponse({
    status: 200,
    description: 'Dispatch acknowledged successfully',
  })
  async acknowledgeDispatch(
    @Param('emergencyServiceId', ParseUUIDPipe) emergencyServiceId: string,
    @Body() acknowledgeDto: AcknowledgeDispatchDto,
    @CurrentUser('sub') responderId: string,
  ) {
    try {
      const updated = await this.dispatchService.acknowledgeDispatch(
        emergencyServiceId,
        responderId,
        acknowledgeDto.message,
      );

      return {
        success: true,
        data: updated,
        message: 'Dispatch acknowledged. You are marked as en-route.',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to acknowledge dispatch: ${error.message}`,
      );
    }
  }

  @Patch(':emergencyServiceId/status')
  @Roles(UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({
    summary: 'Update responder status during response',
    description:
      'Responder updates their status as they progress through the response: en-route -> on-scene -> completed. Can include location updates and notes.',
  })
  @ApiBody({ type: UpdateResponderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  async updateResponderStatus(
    @Param('emergencyServiceId', ParseUUIDPipe) emergencyServiceId: string,
    @Body() updateStatusDto: UpdateResponderStatusDto,
    @CurrentUser('sub') responderId: string,
  ) {
    try {
      const updated = await this.dispatchService.updateResponderStatus(
        emergencyServiceId,
        responderId,
        updateStatusDto.status,
        updateStatusDto.notes,
        updateStatusDto.currentLatitude && updateStatusDto.currentLongitude
          ? {
              latitude: updateStatusDto.currentLatitude,
              longitude: updateStatusDto.currentLongitude,
            }
          : undefined,
      );

      return {
        success: true,
        data: updated,
        message: `Status updated to ${updateStatusDto.status}`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update status: ${error.message}`,
      );
    }
  }
}
