import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { ParsePositiveIdPipe } from '../../common/pipes/positive-id.pipe.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.dto.js';
import { FilterReservationsDto } from './dto/filter-maintenances.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { ReservationStatus } from './enums/maintenance-status.enum.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { MaintenanceService } from './maintenances.service.js';

const EXAMPLE_RESERVATION = {
  id: 1,
  guest: 'Juan Perez',
  guestDocument: '12345678',
  roomType: 'SUITE',
  checkInDate: '2027-02-13',
  checkOutDate: '2027-02-17',
  receptionistId: 1,
  roomId: 3,
  status: 'PENDING',
  createdAt: '2026-10-25T15:04:05.000Z',
  updatedAt: '2026-10-25T15:04:05.000Z',
};

@ApiTags('Maintenance')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('maintenance')
export class ReservationsController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a maintenance',
    description:
      'Any valid role can register. The initial status is always SCHEDULED. A mechanichs registers ' +
      'on their own behalf (the mechanichs value is ignored); admin and mechanichs must send a ' +
      'mechanichstId that exists, is active and belongs to a mechanichs user. carId must exist.',
  })
  @ApiCreatedResponse({
    description: 'Reservation created',
    schema: { example: { success: true, data: EXAMPLE_RESERVATION } },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Invalid DTO, wrong dates, unknown room or invalid receptionist',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Missing x-api-key, invalid key or unknown x-user',
  })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Role not allowed' })
  create(
    @Body() createReservationDto: CreateMaintenanceDto,
    @CurrentUser() user: User,
  ): Promise<Maintenance> {
    return this.maintenanceService.create(createReservationDto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'List the reservations the user is allowed to see',
    description:
      'admin and coordinator see the whole chain; a receptionist only sees their own reservations. ' +
      'The optional ?status= filter is combined with that restriction.',
  })
  @ApiOkResponse({
    description: 'Visible reservations',
    schema: { example: { success: true, data: [EXAMPLE_RESERVATION] } },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'The status filter value is not part of the catalogue',
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Invalid identity' })
  findAll(
    @Query() filterReservationsDto: FilterReservationsDto,
    @CurrentUser() user: User,
  ): Promise<Maintenance[]> {
    return this.maintenanceService.findAll(filterReservationsDto, user);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Reservations count per status for the whole chain',
    description: 'Restricted to admin and coordinator.',
  })
  @ApiOkResponse({
    description: 'Count per status',
    schema: {
      example: {
        success: true,
        data: [
          { status: 'SCHEDULED', total: 3 },
          { status: 'CONFIRMED', total: 2 },
          { status: 'IN_PROGRESS', total: 1 },
          { status: 'COMPLETED', total: 0 },
          { status: 'CANCELLED', total: 1 },
        ],
      },
    },
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'A receptionist cannot read the summary',
  })
  summary(): Promise<{ status: ReservationStatus; total: number }[]> {
    return this.maintenanceService.summary();
  }

  @Get(':id')
  @Roles(Role.ADMIN,  Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Get one maintenance',
    description:
      'Knowing the id is not enough: a mechanich can only read reservations assigned to them.',
  })
  @ApiParam({ name: 'id', description: 'mainteance id', example: 1 })
  @ApiOkResponse({
    description: 'mainteance detail',
    schema: { example: { success: true, data: EXAMPLE_RESERVATION } },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'The id is not a number',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Mainteance does not exist' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'mainteance belongs to another mechanich',
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Invalid identity' })
  findOne(
    @Param('id', ParsePositiveIdPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Maintenance> {
    return this.maintenanceService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN,  Role.TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change the status of a mainteance',
    description:
      'Only the "status" field is accepted. admin and thecnician can change any mainteance; a ' +
      'mechanics only their own and can never cancel. Status jumps are not allowed.',
  })
  @ApiParam({ name: 'id', description: 'Reservation id', example: 1 })
  @ApiOkResponse({
    description: 'Mainteance with the new status',
    schema: {
      example: { success: true, data: { ...EXAMPLE_RESERVATION, status: 'CONFIRMED' } },
    },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Unknown status or fields that do not belong to the operation',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'maintenance does not exist' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'maintenance of another user or cancellation by a technician',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Invalid transition (status jump, final status, ...)',
  })
  updateStatus(
    @Param('id', ParsePositiveIdPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: User,
  ): Promise<Maintenance> {
    return this.maintenanceService.updateStatus(id, updateStatusDto, user);
  }
}
