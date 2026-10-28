import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workshop } from '../../workshops/entities/workshop.entity.js';
import { CarStatus } from '../enums/car-status.enum.js';
import { brandCar } from '../enums/car-type.enum.js';
import { IsNumber } from 'class-validator';

/** Rooms available in each branch. */
@Entity('cars')
export class Car {
  @ApiProperty({ example: 1, description: 'Auto generated identifier' })
  @PrimaryGeneratedColumn()
  id: number;


  @ApiProperty({ example: '101', description: 'Vehicle registration' })
  @Column({ type: 'varchar', length: 10 })
  Registration: string;

  @ApiProperty({ example: 'DOUBLE', description: 'BrandCar', enum: brandCar })
  @Column({ name: 'room_type', type: 'varchar', length: 20 })
  brandCar: brandCar;

  @ApiProperty({ example: 4, description: 'MODEL CAR' })
  @Column({ type: 'int' })
  year: number;
  
  @ApiProperty({ example: 15000 })
  @IsNumber()
  mileage: number;

  @ApiProperty({ example: 'AVAILABLE', description: 'Operational status', enum: CarStatus })
  @Column({ type: 'varchar', length: 20, default: CarStatus.AVAILABLE })
  status: CarStatus;

  @ApiProperty({ example: 1, description: 'workshop car belongs to' })
  @Column({ name: 'hotel_id' })
  workshopid: number;


  @ApiProperty({ example: 1, description: 'car model' })
  @Column({ type: 'varchar' })
  model: string

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Workshop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'hotel_id' })
  workshop: Workshop;

  @ApiProperty({ example: false, description: 'Soft delete flag' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
