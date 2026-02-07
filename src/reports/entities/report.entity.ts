import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from '../../accidents/entities/accident.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accidentId' })
  accident: Accident;

  @Column({ type: 'uuid' })
  officerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'officerId' })
  officer: User;

  @Column({ unique: true })
  reportNumber: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
