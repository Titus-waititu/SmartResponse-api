import { User } from 'src/users/entities/user.entity';
import { AccidentReport } from 'src/accident-reports/entities/accident-report.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

export enum ResponseStatus {
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Response {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.DISPATCHED,
  })
  status: ResponseStatus;

  @Column({ type: 'timestamp', nullable: true })
  dispatched_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  arrived_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  estimated_arrival_minutes: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // Relations
  @ManyToOne(() => AccidentReport, (report) => report.responses, {
    onDelete: 'CASCADE',
  })
  accident_report: Relation<AccidentReport>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  responder: Relation<User>;
}
