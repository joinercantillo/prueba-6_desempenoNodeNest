import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CompleteMaintenanceDto {
  @ApiProperty({ example: 'Replaced oil filter, engine oil, and front brake pads.', description: 'Work completed details' })
  @IsString()
  @IsNotEmpty()
  workDone: string;

  @ApiProperty({ example: 250.50, description: 'Final cost' })
  @IsNumber()
  finalCost: number;

  @ApiProperty({ example: '2026-11-02', description: 'Completion date' })
  @IsString()
  @IsNotEmpty()
  completionDate: string;

  @ApiProperty({ example: 45050, description: 'Final vehicle mileage' })
  @IsNumber()
  finalMileage: number;
}