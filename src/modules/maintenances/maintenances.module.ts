import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainteanceModule } from '../mechanics/mechanichs.module.js';
import { CarsModule } from '../cars/cars.module.js';
import { UsersModule } from '../users/users.module.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { MaintenancesController } from './maintenances.controller.js';
import { MaintenancesService } from './maintenances.service.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { WorkshopsModule } from '../workshops/workshops.module.js'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    UsersModule,
    MainteanceModule,
    CarsModule,
    WorkshopsModule
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  
})
export class ReservationsModule {}
