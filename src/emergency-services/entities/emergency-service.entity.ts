import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from '../../accidents/entities/accident.entity';
import { User } from '../../users/entities/user.entity';

export enum ServiceType {
  POLICE = 'police',
  AMBULANCE = 'ambulance',
  FIRE_DEPARTMENT = 'fire_department',
  TOW_TRUCK = 'tow_truck',
  OTHER = 'other',
}

export enum ServiceStatus {
  REQUESTED = 'requested',
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('emergency_services')
export class EmergencyService {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'accident_id' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @ApiProperty({ enum: ServiceType })
  @Column({ type: 'enum', enum: ServiceType })
  type: ServiceType;

  @ApiProperty({ enum: ServiceStatus })
  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.REQUESTED,
  })
  status: ServiceStatus;

  @ApiProperty()
  @Column({ name: 'service_provider' })
  serviceProvider: string;

  @ApiProperty()
  @Column({ name: 'contact_number' })
  contactNumber: string;

  @ApiProperty()
  @Column({ name: 'dispatched_at', nullable: true })
  dispatchedAt?: Date;

  @ApiProperty()
  @Column({ name: 'arrived_at', nullable: true })
  arrivedAt?: Date;

  @ApiProperty()
  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @ApiProperty()
  @Column({ name: 'responder_id', nullable: true })
  responderId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responder_id' })
  responder?: User;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
