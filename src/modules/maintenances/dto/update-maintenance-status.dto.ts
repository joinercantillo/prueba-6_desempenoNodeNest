import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReservationStatus } from '../enums/maintenance-status.enum.js';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ example: 'IN_PROGRESS', enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
}