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
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'hashed_refresh_token', select: false })
  hashedRefreshToken: string;

  @ApiProperty()
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @ApiProperty()
  @Column({ name: 'user_agent', nullable: true, length: 500 })
  userAgent?: string;

  @ApiProperty()
  @Column({ name: 'device_name', nullable: true })
  deviceName?: string;

  @ApiProperty()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({
    name: 'last_activity',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivity: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
