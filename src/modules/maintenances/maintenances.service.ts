import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Maintenance } from './entities/maintenances.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto.js';
import { ReservationStatus } from './enums/maintenance-status.enum.js';
import { MechanicsService } from './../mechanics/mechanichs.service.js';
import { CarsService } from '../cars/cars.service.js';
import { WorkshopsService } from './../workshops/workshops.service.js'

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    private readonly mechanicsService: MechanicsService,
    private readonly carsService: CarsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  // 1, 2, 3, 4, 5 & Rule Validation: Create maintenance
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    // 1. Validate Car exists and is active
    const car = await this.carsService.findOne(dto.roomId);
    if (car.isActive === false) {
      throw new BadRequestException('Cannot assign maintenance to an inactive car.');
    }

    // 2. Validate Mechanic exists and is active
    const mechanic = await this.mechanicsService.findOne(dto.receptionistId);
    if (!mechanic.active) {
      throw new BadRequestException('Cannot assign maintenance to an inactive mechanic.');
    }

    // 3. Validate Workshop exists and is active
    const workshop = await this.workshopsService.findOne(dto.workshopId);
    if (!workshop.active) {
      throw new BadRequestException('Cannot assign maintenance to an inactive workshop.');
    }

    // 4. Validate Mechanic Schedule Overlap Across All Workshops
    const overlappingMaintenance = await this.maintenanceRepository.createQueryBuilder('m')
      .where('m.receptionist_id = :mechanicId', { mechanicId: dto.receptionistId })
      .andWhere('m.status IN (:...statuses)', { statuses: [ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS] })
      .andWhere('m.check_in < :checkOut AND m.check_out > :checkIn', {
        checkIn: dto.checkInDate,
        checkOut: dto.checkOutDate,
      })
      .getOne();

    if (overlappingMaintenance) {
      throw new ConflictException('The assigned mechanic already has an active maintenance scheduled during this timeframe.');
    }

    // Create record with initial status SCHEDULED
    const maintenance = this.maintenanceRepository.create({
      guest: dto.description, // Mapped description
      guestDocument: dto.type, // Mapped type
      brandCar: dto.brandCar,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      receptionistId: dto.receptionistId,
      roomId: dto.roomId,
      status: ReservationStatus.SCHEDULED,
    });

    return await this.maintenanceRepository.save(maintenance);
  }

  // 8a. Consult all maintenances
  async findAll(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      relations: ['mechanichs', 'room'] as any,
    });
  }

  // 8b. Consult active maintenances (SCHEDULED or IN_PROGRESS)
  async findActive(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      where: {
        status: In([ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS]),
      },
      relations: ['mechanichs', 'room'] as any,
    });
  }

  // 8c. Consult maintenances by car
  async findByCar(carId: number): Promise<Maintenance[]> {
    await this.carsService.findOne(carId);
    return await this.maintenanceRepository.find({
      where: { roomId: carId },
      relations: ['mechanichs', 'room'] as any,
    });
  }

  // 8d. Consult maintenances assigned to a mechanic
  async findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId);
    return await this.maintenanceRepository.find({
      where: { receptionistId: mechanicId },
      relations: ['mechanichs', 'room'] as any,
    });
  }

  // 8e. Consult maintenance history for a car
  async findCarHistory(carId: number): Promise<Maintenance[]> {
    await this.carsService.findOne(carId);
    return await this.maintenanceRepository.find({
      where: { roomId: carId },
      order: { createdAt: 'DESC' },
      relations: ['mechanichs', 'room'] as any,
    });
  }

  // Find single maintenance record
  async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['mechanichs', 'room'] as any,
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found.`);
    }

    return maintenance;
  }

  // 7. Update maintenance status
  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    maintenance.status = dto.status;
    return await this.maintenanceRepository.save(maintenance);
  }

  // 9. Complete maintenance record
  async completeMaintenance(id: number, dto: CompleteMaintenanceDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (maintenance.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Maintenance is already marked as completed.');
    }

    maintenance.status = ReservationStatus.COMPLETED;
    maintenance.checkOutDate = dto.completionDate;

    return await this.maintenanceRepository.save(maintenance);
  }
}