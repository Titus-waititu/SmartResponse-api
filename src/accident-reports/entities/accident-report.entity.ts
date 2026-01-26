import { User } from 'src/users/entities/user.entity';
import { Response } from 'src/responses/entities/response.entity';
import { Media } from 'src/media/entities/media.entity';
import { InsuranceClaim } from 'src/insurance-claims/entities/insurance-claim.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

export enum AccidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum AccidentStatus {
  REPORTED = 'reported',
  RESPONDERS_DISPATCHED = 'responders_dispatched',
  ON_SCENE = 'on_scene',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity()
export class AccidentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: AccidentSeverity })
  severity: AccidentSeverity;

  @Column({
    type: 'enum',
    enum: AccidentStatus,
    default: AccidentStatus.REPORTED,
  })
  status: AccidentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'int', default: 0 })
  vehicles_involved: number;

  @Column({ type: 'int', default: 0 })
  injuries_reported: number;

  @Column({ type: 'int', default: 0 })
  fatalities: number;

  @Column({ type: 'boolean', default: false })
  emergency_services_notified: boolean;

  @Column({ type: 'text', nullable: true })
  weather_conditions: string;

  @Column({ type: 'text', nullable: true })
  road_conditions: string;

  @Column({ type: 'text', nullable: true })
  additional_notes: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reported_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  reporter: Relation<User>;

  @OneToMany(() => Response, (response) => response.accident_report)
  responses: Relation<Response[]>;

  @OneToMany(() => Media, (media) => media.accident_report)
  media: Relation<Media[]>;

  @OneToMany(() => InsuranceClaim, (claim) => claim.accident_report)
  insurance_claims: Relation<InsuranceClaim[]>;
}
