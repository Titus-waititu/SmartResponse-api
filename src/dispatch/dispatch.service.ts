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
}
