import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanichs } from './entities/mechanichs.entity.js';
import { MechanicsController } from './mechanichs.controller.js';
import { MechanicsService } from './mechanichs.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanichs])],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  exports: [MechanicsService],
})
export class MainteanceModule {}
