import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Maintenance } from './entities/maintenances.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto.js';
import { ReservationStatus } from './enums/maintenance-status.enum.js';
import { MechanicsService } from './../mechanics/mechanichs.service.js';
import { CarsService } from './../cars/cars.service.js';
import { WorkshopsService } from './../workshops/workshops.service.js';
import { CarStatus } from './../cars/enums/car-status.enum.js';

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    private readonly mechanicsService: MechanicsService,
    private readonly carsService: CarsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    // 1. Validate Car exists and is active
    const car = await this.carsService.findOne(dto.roomId);
    if (!car) {
      throw new NotFoundException('Vehicle does not exist.');
    }
    if (car.isActive === false) {
      throw new BadRequestException('Cannot create maintenance for an inactive vehicle.');
    }

    // 2. Validate Mechanic exists and is active
    const mechanic = await this.mechanicsService.findOne(dto.receptionistId);
    if (!mechanic || !mechanic.active) {
      throw new BadRequestException('Cannot assign a non-existent or inactive mechanic.');
    }

    // 3. Validate Workshop exists and is active
    const workshop = await this.workshopsService.findOne(dto.workshopId);
    if (!workshop || !workshop.active) {
      throw new BadRequestException('Cannot assign a non-existent or inactive workshop.');
    }

    // 4. Validate Mileage: Maintenance mileage cannot be lower than current vehicle mileage
    if (dto.mileage < car.mileage) {
      throw new BadRequestException(`Maintenance mileage (${dto.mileage}) cannot be lower than current vehicle mileage (${car.mileage}).`);
    }

    // 5. Check overlapping active maintenances for the Vehicle
    const carOverlap = await this.maintenanceRepository.createQueryBuilder('m')
      .where('m.room_id = :carId', { carId: dto.roomId })
      .andWhere('m.status IN (:...statuses)', { statuses: [ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS] })
      .andWhere('m.check_in < :checkOut AND m.check_out > :checkIn', {
        checkIn: dto.checkInDate,
        checkOut: dto.checkOutDate,
      })
      .getOne();

    if (carOverlap) {
      throw new ConflictException('The vehicle already has an active maintenance scheduled or in progress during this timeframe.');
    }

    // 6. Check overlapping active maintenances for the Mechanic
    const mechanicOverlap = await this.maintenanceRepository.createQueryBuilder('m')
      .where('m.receptionist_id = :mechanicId', { mechanicId: dto.receptionistId })
      .andWhere('m.status IN (:...statuses)', { statuses: [ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS] })
      .andWhere('m.check_in < :checkOut AND m.check_out > :checkIn', {
        checkIn: dto.checkInDate,
        checkOut: dto.checkOutDate,
      })
      .getOne();

    if (mechanicOverlap) {
      throw new ConflictException('The mechanic already has an active maintenance scheduled or in progress during this timeframe.');
    }

    // Create record with initial status SCHEDULED
    const maintenance = this.maintenanceRepository.create({
      guest: dto.description,
      guestDocument: dto.type,
      brandCar: dto.brandCar,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      receptionistId: dto.receptionistId,
      roomId: dto.roomId,
      status: ReservationStatus.SCHEDULED,
    });

    return await this.maintenanceRepository.save(maintenance);
  }

  async findAll(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      relations: { mechanichs: true, room: true } as any,
    });
  }

  async findActive(): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      where: {
        status: In([ReservationStatus.SCHEDULED, ReservationStatus.IN_PROGRESS]),
      },
      relations: { mechanichs: true, room: true } as any,
    });
  }

  async findByCar(carId: number): Promise<Maintenance[]> {
    await this.carsService.findOne(carId);
    return await this.maintenanceRepository.find({
      where: { roomId: carId },
      relations: { mechanichs: true, room: true } as any,
    });
  }

  async findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId);
    return await this.maintenanceRepository.find({
      where: { receptionistId: mechanicId },
      relations: { mechanichs: true, room: true } as any,
    });
  }

  async findCarHistory(carId: number): Promise<Maintenance[]> {
    await this.carsService.findOne(carId);
    return await this.maintenanceRepository.find({
      where: { roomId: carId },
      order: { createdAt: 'DESC' },
      relations: { mechanichs: true, room: true } as any,
    });
  }

  async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: { mechanichs: true, room: true } as any,
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found.`);
    }

    return maintenance;
  }

  // 7, 9 & State Machine Transitions Rules
  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    const currentStatus = maintenance.status;
    const newStatus = dto.status;

    // Rule: COMPLETED maintenance cannot revert to a previous state
    if (currentStatus === ReservationStatus.COMPLETED) {
      throw new BadRequestException('A COMPLETED maintenance cannot revert to a previous state.');
    }

    // Rule: CANCELLED maintenance cannot change to IN_PROGRESS or COMPLETED
    if (currentStatus === ReservationStatus.CANCELLED) {
      throw new BadRequestException('A CANCELLED maintenance cannot change to IN_PROGRESS or COMPLETED.');
    }

    // Rule: When changing to IN_PROGRESS, vehicle automatically becomes IN_MAINTENANCE
    if (newStatus === ReservationStatus.IN_PROGRESS) {
      await this.carsService.updateStatus(maintenance.roomId, CarStatus.MAINTENANCE);
    }

    // Rule: If transitioning from IN_PROGRESS/SCHEDULED to CANCELLED, ensure vehicle status is handled if needed
    maintenance.status = newStatus;
    const updated = await this.maintenanceRepository.save(maintenance);

    return updated;
  }

  async completeMaintenance(id: number, dto: CompleteMaintenanceDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (maintenance.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Maintenance is already marked as completed.');
    }

    if (maintenance.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('A CANCELLED maintenance cannot be completed.');
    }

    // Rule: Required closing information validation
    if (!dto.workDone || dto.finalCost === undefined || !dto.completionDate || dto.finalMileage === undefined) {
      throw new BadRequestException('Cannot complete maintenance without mandatory closing information (workDone, finalCost, completionDate, finalMileage).');
    }

    // Update vehicle final mileage and status back to AVAILABLE
    await this.carsService.updateMileage(maintenance.roomId, dto.finalMileage);
    await this.carsService.updateStatus(maintenance.roomId, CarStatus.AVAILABLE);

    maintenance.status = ReservationStatus.COMPLETED;
    maintenance.checkOutDate = dto.completionDate;

    return await this.maintenanceRepository.save(maintenance);
  }
}