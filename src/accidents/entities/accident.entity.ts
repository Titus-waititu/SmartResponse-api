import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AccidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  FATAL = 'fatal',
}

export enum AccidentStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('accidents')
export class Accident {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'report_number', unique: true })
  reportNumber: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ enum: AccidentSeverity })
  @Column({ type: 'enum', enum: AccidentSeverity })
  severity: AccidentSeverity;

  @ApiProperty({ enum: AccidentStatus })
  @Column({
    type: 'enum',
    enum: AccidentStatus,
    default: AccidentStatus.REPORTED,
  })
  status: AccidentStatus;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @ApiProperty()
  @Column({ name: 'location_address' })
  locationAddress: string;

  @ApiProperty()
  @Column({ name: 'accident_date' })
  accidentDate: Date;

  @ApiProperty()
  @Column({ name: 'weather_conditions', nullable: true })
  weatherConditions?: string;

  @ApiProperty()
  @Column({ name: 'road_conditions', nullable: true })
  roadConditions?: string;

  @ApiProperty()
  @Column({ name: 'number_of_vehicles', default: 0 })
  numberOfVehicles: number;

  @ApiProperty()
  @Column({ name: 'number_of_injuries', default: 0 })
  numberOfInjuries: number;

  @ApiProperty()
  @Column({ name: 'number_of_fatalities', default: 0 })
  numberOfFatalities: number;

  @ApiProperty()
  @Column({ name: 'reported_by_id' })
  reportedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy: User;

  @ApiProperty()
  @Column({ name: 'assigned_officer_id', nullable: true })
  assignedOfficerId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_officer_id' })
  assignedOfficer?: User;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
