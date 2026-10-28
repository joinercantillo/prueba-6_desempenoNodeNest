import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { CarsService } from './cars.service.js';
import { CreateCarDto } from './dto/create-car.dto.js';
import { UpdateCarDto } from './dto/update-car.dto.js';
import { Car } from './entities/car.entity.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('Cars')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Register a new car',
    description: 'Allows an administrator to register a new vehicle ensuring the registration plate is unique.',
  })
  @ApiCreatedResponse({
    description: 'Car successfully created',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          Registration: 'XYZ-123',
          brandCar: 'Chevrolet',
          year: 2023,
          mileage: 15000,
          status: 'AVAILABLE',
          workshopid: 1,
          model: 'Corolla',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'A car with this registration plate already exists.' })
  create(@Body() createCarDto: CreateCarDto): Promise<Car> {
    return this.carsService.create(createCarDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'List the cars of the workshop',
    description: 'Read-only master data of active vehicles.',
  })
  @ApiOkResponse({
    description: 'Car list retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            Registration: 'XYZ-123',
            brandCar: 'SEDAN',
            year: 2023,
            mileage: 15000,
            status: 'AVAILABLE',
            workshopid: 1,
            model: 'Corolla',
          },
        ],
      },
    },
  })
  findAll(): Promise<Car[]> {
    return this.carsService.findAll();
  }

  @Get(':term')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Find a car by ID or Registration Plate',
    description: 'Search for specific car information using either its numeric identifier or its unique registration plate.',
  })
  @ApiOkResponse({
    description: 'Car found successfully',
  })
  @ApiNotFoundResponse({ description: 'Car not found' })
  findOne(@Param('term') term: string): Promise<Car> {
    return this.carsService.findOne(term);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update car information',
    description: 'Allows the administrator to update a vehicle data (restricted for Admin role).',
  })
  @ApiOkResponse({
    description: 'Car updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Car not found' })
  @ApiConflictResponse({ description: 'Registration plate already in use by another car' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCarDto: UpdateCarDto,
  ): Promise<Car> {
    return this.carsService.update(id, updateCarDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Soft delete car',
    description: 'Implements logical deletion (inactivation) to preserve historical maintenance records.',
  })
  @ApiOkResponse({
    description: 'Car deactivated successfully',
  })
  @ApiNotFoundResponse({ description: 'Car not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.carsService.remove(id);
  }
}