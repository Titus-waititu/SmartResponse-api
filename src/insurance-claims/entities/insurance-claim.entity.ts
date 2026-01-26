import { AccidentReport } from 'src/accident-reports/entities/accident-report.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity()
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  claim_number: string;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.SUBMITTED })
  status: ClaimStatus;

  @Column({ type: 'varchar', length: 255 })
  insurance_company: string;

  @Column({ type: 'varchar', length: 100 })
  policy_number: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  estimated_damage_cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approved_amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  // Relations
  @ManyToOne(() => AccidentReport, (report) => report.insurance_claims, {
    onDelete: 'CASCADE',
  })
  accident_report: Relation<AccidentReport>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  claimant: Relation<User>;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  insurance_agent: Relation<User>;
}
