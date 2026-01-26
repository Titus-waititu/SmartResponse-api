import { AccidentReport } from 'src/accident-reports/entities/accident-report.entity';
import { Response } from 'src/responses/entities/response.entity';
import { Media } from 'src/media/entities/media.entity';
import { InsuranceClaim } from 'src/insurance-claims/entities/insurance-claim.entity';
import { UserRole } from 'src/types';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Relation,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.REPORTER })
  role: UserRole;

  // 📍 Location-based fields for emergency responders
  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  // Emergency responder specific fields
  @Column({ nullable: true })
  badge_number: string;

  @Column({ nullable: true })
  department_name: string;

  @Column({ nullable: true })
  vehicle_number: string;

  // Insurance agent specific fields
  @Column({ nullable: true })
  insurance_company: string;

  @Column({ nullable: true })
  license_number: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true, default: null })
  hashedRefreshToken: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // 📦 Relations
  @OneToMany(() => AccidentReport, (report) => report.reporter)
  reported_accidents: Relation<AccidentReport[]>;

  @OneToMany(() => Response, (response) => response.responder)
  responses: Relation<Response[]>;

  @OneToMany(() => Media, (media) => media.uploaded_by)
  uploaded_media: Relation<Media[]>;

  @OneToMany(() => InsuranceClaim, (claim) => claim.claimant)
  insurance_claims: Relation<InsuranceClaim[]>;

  @OneToMany(() => InsuranceClaim, (claim) => claim.insurance_agent)
  assigned_claims: Relation<InsuranceClaim[]>;
}
