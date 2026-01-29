import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Accident } from '../../accidents/entities/accident.entity';

export enum NotificationType {
  ACCIDENT_REPORTED = 'accident_reported',
  ACCIDENT_ASSIGNED = 'accident_assigned',
  STATUS_UPDATE = 'status_update',
  EMERGENCY_ALERT = 'emergency_alert',
  SYSTEM_NOTIFICATION = 'system_notification',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: NotificationPriority })
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @ApiProperty()
  @Column({ name: 'accident_id', nullable: true })
  accidentId?: string;

  @ManyToOne(() => Accident, { nullable: true })
  @JoinColumn({ name: 'accident_id' })
  accident?: Accident;

  @ApiProperty()
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ApiProperty()
  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
