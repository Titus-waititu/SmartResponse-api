import { AccidentReport } from 'src/accident-reports/entities/accident-report.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

@Entity()
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name: string;

  @Column({ type: 'enum', enum: MediaType })
  media_type: MediaType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;

  // Relations
  @ManyToOne(() => AccidentReport, (report) => report.media, {
    onDelete: 'CASCADE',
  })
  accident_report: Relation<AccidentReport>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  uploaded_by: Relation<User>;
}
