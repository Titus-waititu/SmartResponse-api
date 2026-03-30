import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmergencyService,
  ServiceType,
  ServiceStatus,
} from '../emergency-services/entities/emergency-service.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../notifications/entities/notification.entity';

export interface DispatchResult {
  services: EmergencyService[];
  notification: Notification;
  dispatchTime: Date;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @InjectRepository(EmergencyService)
    private emergencyServiceRepo: Repository<EmergencyService>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async dispatchEmergencyServices(
    accidentId: string,
    userId: string,
    severity: number,
    location: { latitude: number; longitude: number },
  ): Promise<DispatchResult> {
    this.logger.log(
      `Dispatching emergency services for accident ${accidentId} with severity ${severity}`,
    );

    const services: EmergencyService[] = [];
    const dispatchTime = new Date();

    // Determine which services to dispatch based on severity
    const servicesToDispatch = this.determineServicesNeeded(severity);

    // Create emergency service records
    for (const serviceType of servicesToDispatch) {
      const service = this.emergencyServiceRepo.create({
        accidentId,
        type: serviceType,
        status: ServiceStatus.DISPATCHED,
        serviceProvider: this.getServiceProvider(serviceType, location),
        contactNumber: this.getEmergencyContact(serviceType),
        dispatchedAt: dispatchTime,
        notes: `Auto-dispatched based on AI severity analysis: ${severity}/100`,
      });

      services.push(await this.emergencyServiceRepo.save(service));
    }

    // Create notification for user
    const notification = await this.createDispatchNotification(
      userId,
      accidentId,
      services,
      severity,
    );

    return {
      services,
      notification,
      dispatchTime,
    };
  }

  private determineServicesNeeded(severity: number): ServiceType[] {
    const services: ServiceType[] = [];

    if (severity > 70) {
      // Critical - dispatch all services
      services.push(
        ServiceType.POLICE,
        ServiceType.AMBULANCE,
        ServiceType.FIRE_DEPARTMENT,
      );
    } else if (severity > 50) {
      // High severity - police and ambulance
      services.push(ServiceType.POLICE, ServiceType.AMBULANCE);
    } else if (severity > 30) {
      // Medium severity - police only
      services.push(ServiceType.POLICE);
    }
    // Low severity (<30) - no automatic dispatch, just notification

    return services;
  }

  private getServiceProvider(
    type: ServiceType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _location: { latitude: number; longitude: number },
  ): string {
    // In production, this would query a database of nearby service providers
    // For now, return default providers
    switch (type) {
      case ServiceType.POLICE:
        return 'Local Police Department';
      case ServiceType.AMBULANCE:
        return 'Emergency Medical Services';
      case ServiceType.FIRE_DEPARTMENT:
        return 'City Fire Department';
      case ServiceType.TOW_TRUCK:
        return 'Roadside Assistance';
      default:
        return 'Emergency Services';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getEmergencyContact(type: ServiceType): string {
    // In production, this would be based on location and actual emergency numbers
    return '911';
  }

  private async createDispatchNotification(
    userId: string,
    accidentId: string,
    services: EmergencyService[],
    severity: number,
  ): Promise<Notification> {
    const servicesList = services.map((s) => s.type).join(', ');
    const priority =
      severity > 70
        ? NotificationPriority.URGENT
        : severity > 50
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM;

    const notification = this.notificationRepo.create({
      userId,
      accidentId,
      type: NotificationType.EMERGENCY_ALERT,
      title: 'Emergency Services Dispatched',
      message: `Emergency services have been dispatched to your accident location. Services: ${servicesList}. Estimated arrival: 5-10 minutes. Severity: ${severity}/100`,
      priority,
      isRead: false,
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Send dispatch instruction directly to a specific responder
   * Used by dispatchers to assign specific incidents to responders
   */
  async sendDispatchToResponder(
    accidentId: string,
    responderId: string,
    serviceType: ServiceType,
    severity: number,
    incidentDescription: string,
    location: { latitude: number; longitude: number },
    dispatchData?: any,
  ): Promise<{
    emergencyService: EmergencyService;
    notification: Notification;
  }> {
    this.logger.log(
      `Dispatching responder ${responderId} to accident ${accidentId} for ${serviceType}`,
    );

    const dispatchTime = new Date();

    // Create emergency service record with responder assignment
    const emergencyService = this.emergencyServiceRepo.create({
      accidentId,
      type: serviceType,
      status: ServiceStatus.DISPATCHED,
      responderId,
      serviceProvider: this.getServiceProvider(serviceType, location),
      contactNumber: this.getEmergencyContact(serviceType),
      dispatchedAt: dispatchTime,
      notes: `Direct dispatch by dispatcher. Severity: ${severity}/100. ${incidentDescription}`,
    });

    const savedService = await this.emergencyServiceRepo.save(emergencyService);

    // Create notification for responder with full incident details
    const priority =
      severity > 70
        ? NotificationPriority.URGENT
        : severity > 50
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM;

    const address = dispatchData?.address || 'Location coordinates available';
    const notification = this.notificationRepo.create({
      userId: responderId,
      accidentId,
      type: NotificationType.RESPONDER_ASSIGNMENT,
      title: `${serviceType.toUpperCase()} Dispatch Assignment`,
      message: `You have been assigned to an incident at ${address}. Severity: ${severity}/100. ${incidentDescription}. Number of injuries: ${dispatchData?.numberOfInjuries || 0}. Weather: ${dispatchData?.weatherConditions || 'Unknown'}`,
      priority,
      isRead: false,
    });

    const savedNotification = await this.notificationRepo.save(notification);

    return {
      emergencyService: savedService,
      notification: savedNotification,
    };
  }

  /**
   * Get all dispatch assignments for a specific responder
   * Used by responders to see their assigned incidents
   */
  async getResponderAssignments(
    responderId: string,
    includeCompleted: boolean = false,
  ): Promise<EmergencyService[]> {
    this.logger.log(`Fetching assignments for responder ${responderId}`);

    const statuses = includeCompleted
      ? [
          ServiceStatus.DISPATCHED,
          ServiceStatus.EN_ROUTE,
          ServiceStatus.ON_SCENE,
          ServiceStatus.COMPLETED,
        ]
      : [
          ServiceStatus.DISPATCHED,
          ServiceStatus.EN_ROUTE,
          ServiceStatus.ON_SCENE,
        ];

    return this.emergencyServiceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.accident', 'accident')
      .leftJoinAndSelect('service.responder', 'responder')
      .where('service.responderId = :responderId', { responderId })
      .andWhere('service.status IN (:...statuses)', { statuses })
      .orderBy('service.dispatchedAt', 'DESC')
      .getMany();
  }

  /**
   * Get detailed information about a specific dispatch assignment
   * Used by responders to get full incident details
   */
  async getDispatchDetails(
    emergencyServiceId: string,
    responderId: string,
  ): Promise<EmergencyService> {
    const service = await this.emergencyServiceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.accident', 'accident')
      .leftJoinAndSelect('service.responder', 'responder')
      .where('service.id = :id', { id: emergencyServiceId })
      .andWhere('service.responderId = :responderId', { responderId })
      .getOne();

    if (!service) {
      throw new Error(
        `Dispatch not found or not assigned to responder ${responderId}`,
      );
    }

    return service;
  }

  /**
   * Acknowledge dispatch assignment by responder
   * Marks that responder has received and acknowledged the dispatch
   */
  async acknowledgeDispatch(
    emergencyServiceId: string,
    responderId: string,
    message?: string,
  ): Promise<EmergencyService> {
    this.logger.log(
      `Responder ${responderId} acknowledging dispatch ${emergencyServiceId}`,
    );

    const service = await this.getDispatchDetails(
      emergencyServiceId,
      responderId,
    );

    // Update status to EN_ROUTE (responder acknowledged and is responding)
    service.status = ServiceStatus.EN_ROUTE;
    service.notes = `${service.notes || ''}\n[${new Date().toISOString()}] Responder acknowledged: ${message || 'En route to scene'}`;

    return this.emergencyServiceRepo.save(service);
  }

  /**
   * Update responder status during response
   * Used to track responder status: en_route, on_scene, completed
   */
  async updateResponderStatus(
    emergencyServiceId: string,
    responderId: string,
    newStatus: ServiceStatus,
    notes?: string,
    currentLocation?: { latitude: number; longitude: number },
  ): Promise<EmergencyService> {
    this.logger.log(
      `Updating dispatch ${emergencyServiceId} status to ${newStatus}`,
    );

    const service = await this.getDispatchDetails(
      emergencyServiceId,
      responderId,
    );

    // Update status
    service.status = newStatus;

    // Update relevant timestamps
    if (newStatus === ServiceStatus.EN_ROUTE) {
      service.notes = `${service.notes || ''}\n[${new Date().toISOString()}] En route to scene`;
    } else if (newStatus === ServiceStatus.ON_SCENE) {
      service.arrivedAt = new Date();
      service.notes = `${service.notes || ''}\n[${new Date().toISOString()}] Arrived on scene. ${notes || ''}`;
    } else if (newStatus === ServiceStatus.COMPLETED) {
      service.completedAt = new Date();
      service.notes = `${service.notes || ''}\n[${new Date().toISOString()}] Response completed. ${notes || ''}`;
    }

    // Add any additional notes
    if (notes && newStatus !== ServiceStatus.ON_SCENE) {
      service.notes = `${service.notes || ''}\n[${new Date().toISOString()}] ${notes}`;
    }

    return this.emergencyServiceRepo.save(service);
  }

  /**
   * Get active dispatches for a dispatcher
   * Used by dispatchers to see all pending and active dispatches
   */
  async getActiveDispatchesForDispatcher(): Promise<EmergencyService[]> {
    return this.emergencyServiceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.accident', 'accident')
      .leftJoinAndSelect('service.responder', 'responder')
      .where('service.status IN (:...statuses)', {
        statuses: [
          ServiceStatus.DISPATCHED,
          ServiceStatus.REQUESTED,
          ServiceStatus.EN_ROUTE,
          ServiceStatus.ON_SCENE,
        ],
      })
      .orderBy('service.dispatchedAt', 'DESC')
      .getMany();
  }
}
