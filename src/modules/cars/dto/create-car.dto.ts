import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { CarStatus } from './../enums/car-status.enum.js';
import { brandCar } from './../enums/car-type.enum.js'

export class CreateCarDto {
  @ApiProperty({ example: 'XYZ-123', description: 'Vehicle registration plate' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  Registration: string;

  @ApiProperty({ example: 'DOUBLE', enum: brandCar })
  @IsEnum(brandCar)
  brandCar: brandCar;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  mileage: number;

  @ApiProperty({ example: 'Corolla', description: 'Car model' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 1, description: 'Workshop ID' })
  @IsNumber()
  workshopid: number;
}