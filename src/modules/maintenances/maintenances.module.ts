import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainteanceModule } from '../mechanics/mechanichs.module.js';
import { CarsModule } from '../cars/cars.module.js';
import { UsersModule } from '../users/users.module.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { ReservationsController } from './maintenances.controller.js';
import { MaintenanceService } from './maintenances.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    UsersModule,
    MainteanceModule,
    CarsModule,
  ],
  controllers: [ReservationsController],
  providers: [MaintenanceService],
})
export class ReservationsModule {}
