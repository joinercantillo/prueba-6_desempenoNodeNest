import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopController } from './workshops.controller.js';
import { WorkshopsService } from './workshops.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop])],
  controllers: [WorkshopController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class HotelsModule {}
