import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { Car } from './entities/car.entity.js';
import { RoomsService } from './cars.service.js';

@ApiTags('Cars')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('cars')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'List the car of workshop',
    description:
      'Read-only master data. The reservation DTO references a Car through its `carId`.',
  })
  @ApiOkResponse({
    description: 'Room list',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            Registration: '101',
            brandCar: 'Chevrolet',
            year: 2000,
            status: 'AVAILABLE',
            hotelId: 1,
          },
        ],
      },
    },
  })
  findAll(): Promise<Car[]> {
    return this.roomsService.findAll();
  }
}
