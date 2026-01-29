import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({ unique: true })
  username: string;

  @ApiProperty({ writeOnly: true })
  @Column({ select: false })
  password: string;

  @ApiProperty({ required: false })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @ApiProperty()
  @Column({ default: 'user' })
  role: string;

  @ApiProperty()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'hashed_refresh_token', nullable: true, select: false })
  hashedRefreshToken?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ required: false })
  phoneNumber?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
