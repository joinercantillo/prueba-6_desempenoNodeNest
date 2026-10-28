import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiConflictResponse } from '@nestjs/swagger';
import { MaintenancesService } from './maintenances.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('Maintenances')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('maintenance')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new maintenance record', description: 'Creates a maintenance associated with a car, mechanic, and workshop.' })
  @ApiCreatedResponse({ description: 'Maintenance successfully scheduled.' })
  @ApiBadRequestResponse({ description: 'Invalid foreign key entity or inactive car/mechanic/workshop.' })
  @ApiConflictResponse({ description: 'Mechanic schedule overlap detected.' })
  create(@Body() createDto: CreateMaintenanceDto): Promise<Maintenance> {
    return this.maintenancesService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'List all maintenances' })
  @ApiOkResponse({ description: 'Maintenances retrieved successfully.' })
  findAll(): Promise<Maintenance[]> {
    return this.maintenancesService.findAll();
  }

  @Get('active')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'List active maintenances (SCHEDULED or IN_PROGRESS)' })
  @ApiOkResponse({ description: 'Active maintenances retrieved successfully.' })
  findActive(): Promise<Maintenance[]> {
    return this.maintenancesService.findActive();
  }

  @Get('car/:carId')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Get maintenances by car ID' })
  @ApiOkResponse({ description: 'Maintenances retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Car not found.' })
  findByCar(@Param('carId', ParseIntPipe) carId: number): Promise<Maintenance[]> {
    return this.maintenancesService.findByCar(carId);
  }

  @Get('car/:carId/history')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Get full maintenance history of a car' })
  @ApiOkResponse({ description: 'Car maintenance history retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Car not found.' })
  findCarHistory(@Param('carId', ParseIntPipe) carId: number): Promise<Maintenance[]> {
    return this.maintenancesService.findCarHistory(carId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Get maintenances assigned to a specific mechanic' })
  @ApiOkResponse({ description: 'Mechanic maintenances retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Mechanic not found.' })
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number): Promise<Maintenance[]> {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Get a specific maintenance record by ID' })
  @ApiOkResponse({ description: 'Maintenance record found.' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Maintenance> {
    return this.maintenancesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Update maintenance status' })
  @ApiOkResponse({ description: 'Status updated successfully.' })
  @ApiNotFoundResponse({ description: 'Maintenance record not found.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
  ): Promise<Maintenance> {
    return this.maintenancesService.updateStatus(id, dto);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Finalize/Complete a maintenance record' })
  @ApiOkResponse({ description: 'Maintenance completed successfully.' })
  @ApiBadRequestResponse({ description: 'Maintenance already completed.' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteMaintenanceDto,
  ): Promise<Maintenance> {
    return this.maintenancesService.completeMaintenance(id, dto);
  }
}