import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { brandCar } from '../../cars/enums/car-type.enum.js';
import { MaintenanceType } from '../enums/maintenance-type.enum.js';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'PREVENTIVE', enum: MaintenanceType, description: 'Maintenance type' })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Oil change and brake pad replacement', description: 'Maintenance description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45000, description: 'Current vehicle mileage' })
  @IsNumber()
  mileage: number;

  @ApiProperty({ example: '2026-11-01', description: 'Scheduled start date (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiProperty({ example: '2026-11-02', description: 'Scheduled end date (ISO 8601)' })
  @IsString()
  @IsNotEmpty()
  checkOutDate: string;

  @ApiProperty({ example: 1, description: 'Mechanic ID responsible for the maintenance' })
  @IsNumber()
  receptionistId: number;

  @ApiProperty({ example: 1, description: 'Car ID assigned to maintenance' })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 1, description: 'Workshop ID where maintenance takes place' })
  @IsNumber()
  workshopId: number;

  @ApiProperty({ example: 'SEDAN', enum: brandCar, description: 'Car brand/type' })
  @IsEnum(brandCar)
  brandCar: brandCar;
}
