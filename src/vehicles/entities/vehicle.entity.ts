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
import { Accident } from '../../accidents/entities/accident.entity';

export enum VehicleType {
  CAR = 'car',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  BUS = 'bus',
  VAN = 'van',
  BICYCLE = 'bicycle',
  OTHER = 'other',
}

@Entity('vehicles')
export class Vehicle {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'accident_id' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @ApiProperty()
  @Column({ name: 'license_plate' })
  licensePlate: string;

  @ApiProperty()
  @Column()
  make: string;

  @ApiProperty()
  @Column()
  model: string;

  @ApiProperty()
  @Column({ nullable: true })
  year?: number;

  @ApiProperty()
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ enum: VehicleType })
  @Column({ type: 'enum', enum: VehicleType })
  type: VehicleType;

  @ApiProperty()
  @Column({ name: 'driver_name' })
  driverName: string;

  @ApiProperty()
  @Column({ name: 'driver_license_number', nullable: true })
  driverLicenseNumber?: string;

  @ApiProperty()
  @Column({ name: 'driver_phone', nullable: true })
  driverPhone?: string;

  @ApiProperty()
  @Column({ name: 'insurance_company', nullable: true })
  insuranceCompany?: string;

  @ApiProperty()
  @Column({ name: 'insurance_policy_number', nullable: true })
  insurancePolicyNumber?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  damage?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
