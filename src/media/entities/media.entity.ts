import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from '../../accidents/entities/accident.entity';
import { User } from '../../users/entities/user.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

@Entity('media')
export class Media {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'accident_id' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @ApiProperty({ enum: MediaType })
  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @ApiProperty()
  @Column({ name: 'file_name' })
  fileName: string;

  @ApiProperty()
  @Column({ name: 'file_url' })
  fileUrl: string;

  @ApiProperty()
  @Column({ name: 'file_size' })
  fileSize: number;

  @ApiProperty()
  @Column({ name: 'mime_type' })
  mimeType: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
