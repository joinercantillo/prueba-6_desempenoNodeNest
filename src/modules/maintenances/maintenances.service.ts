import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { MechanicsService } from '../mechanics/mechanichs.service.js';
import { CarsService } from '../cars/cars.service.js';
import { User } from '../users/entities/user.entity.js';
import { USER_DIRECTORY } from '../users/user-directory.interface.js';
import type { UserDirectory } from '../users/user-directory.interface.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.dto.js';
import { FilterReservationsDto } from './dto/filter-maintenances.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { ReservationStatus } from './enums/maintenance-status.enum.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { canCancel, isOwner, isValidTransition } from './rules/status-rules.js';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    // Depends on the contract, not on the concrete service (Dependency Inversion).
    @Inject(USER_DIRECTORY)
    private readonly userDirectory: UserDirectory,
    private readonly receptionistsService: MechanicsService,
    private readonly roomsService: CarsService,
  ) {}

  /**
   * RN-01: registers a reservation. The status is always PENDING and the
   * responsible receptionist depends on the role of the caller.
   */
  async create(dto: CreateMaintenanceDto, user: User): Promise<Maintenance> {
    const receptionistId = await this.resolveReceptionistId(dto, user);

    const room = await this.roomsService.findOne(dto.roomId);
    if (!room) {
      throw new BadRequestException(`Room with id "${dto.roomId}" does not exist`);
    }

    const reservation = this.maintenanceRepository.create({
      guest: dto.guest.trim(),
      guestDocument: dto.guestDocument,
      brandCar: dto.branCar,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      receptionistId,
      roomId: dto.roomId,
      status: ReservationStatus.SCHEDULED,
    });

    return this.maintenanceRepository.save(reservation);
  }

  /**
   * RN-02: the filtering happens inside the database query.
   * A receptionist only gets their own reservations and the `status` filter is
   * combined with that restriction, never replaced by it.
   */
  async findAll(query: FilterReservationsDto, user: User): Promise<Maintenance[]> {
    const where: FindOptionsWhere<Maintenance> = {};

    if (user.role === Role.TECHNICIAN && typeof user.mechaId === 'number') {
      where.receptionistId = user.mechaId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.maintenanceRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  /** The access rules also apply to the individual lookup. */
  async findOne(id: number, user: User): Promise<Maintenance> {
    const reservation = await this.maintenanceRepository.findOneBy({ id });

    if (!reservation) {
      throw new NotFoundException(`Reservation with id "${id}" does not exist`);
    }

    this.assertOwnership(reservation, user);
    return reservation;
  }

  /** RN-03: ownership, state machine and cancellation permission. */
  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
    user: User,
  ): Promise<Maintenance> {
    const reservation = await this.findOne(id, user);

    if (!isValidTransition(reservation.status, dto.status)) {
      throw new ConflictException(
        `Invalid status transition: the reservation is in "${reservation.status}" and "${dto.status}" was requested`,
      );
    }

    if (dto.status === ReservationStatus.CANCELLED && !canCancel(user.role)) {
      throw new ForbiddenException(
        `Role "${user.role}" cannot cancel reservations: this action belongs to admin and coordinator`,
      );
    }

    reservation.status = dto.status;
    return this.maintenanceRepository.save(reservation);
  }

  /** Status count for the whole chain (admin and coordinator only). */
  async summary(): Promise<{ status: ReservationStatus; total: number }[]> {
    const statuses = Object.values(ReservationStatus);

    return Promise.all(
      statuses.map(async (status) => ({
        status,
        total: await this.maintenanceRepository.count({ where: { status } }),
      })),
    );
  }

  private async resolveReceptionistId(dto: CreateMaintenanceDto, user: User): Promise<number> {
    // A receptionist can only register reservations on their own behalf;
    // any value sent by the client is ignored.
    if (user.role === Role.TECHNICIAN) {
      if (user.mechaId === null || user.mechaId === undefined) {
        throw new BadRequestException(
          `Receptionist user "${user.username}" is not linked to a row in the receptionists table`,
        );
      }
      return user.mechaId;
    }

    if (dto.receptionistId === undefined) {
      throw new BadRequestException(
        'The "receptionistId" field is required for admins and coordinators',
      );
    }

    const receptionist = await this.receptionistsService.findOne(dto.receptionistId);
    if (!receptionist) {
      throw new BadRequestException(
        `Receptionist with id "${dto.receptionistId}" does not exist`,
      );
    }

    if (!receptionist.active) {
      throw new BadRequestException(
        `Receptionist with id "${dto.receptionistId}" is not active`,
      );
    }

    const linkedUser = await this.userDirectory.findReceptionistByReceptionistId(
      dto.receptionistId,
    );
    if (!linkedUser) {
      throw new BadRequestException(
        `Receptionist with id "${dto.receptionistId}" does not belong to a user with the receptionist role`,
      );
    }

    return receptionist.id;
  }

  private assertOwnership(reservation: Maintenance, user: User): void {
    if (!isOwner(user.role, reservation.receptionistId, user.mechaId)) {
      throw new ForbiddenException(
        'You are not allowed to access this reservation: it is not assigned to your user',
      );
    }
  }
}
