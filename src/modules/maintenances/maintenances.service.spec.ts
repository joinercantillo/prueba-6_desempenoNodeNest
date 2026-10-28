import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service.js';
import { Maintenance } from './entities/maintenances.entity.js';
import { MechanicsService } from '../mechanics/mechanichs.service.js'
import { CarsService } from './../cars/cars.service.js';
import { WorkshopsService } from './../workshops/workshops.service.js';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  })),
});

const mockMechanicsService = () => ({ findOne: jest.fn() });
const mockCarsService = () => ({ findOne: jest.fn(), updateStatus: jest.fn(), updateMileage: jest.fn() });
const mockWorkshopsService = () => ({ findOne: jest.fn() });

describe('MaintenancesService', () => {
  let service: MaintenancesService;
  let carsService: any;
  let mechanicsService: any;
  let workshopsService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancesService,
        { provide: getRepositoryToken(Maintenance), useFactory: mockRepository },
        { provide: MechanicsService, useFactory: mockMechanicsService },
        { provide: CarsService, useFactory: mockCarsService },
        { provide: WorkshopsService, useFactory: mockWorkshopsService },
      ],
    }).compile();

    service = module.get<MaintenancesService>(MaintenancesService);
    carsService = module.get(CarsService);
    mechanicsService = module.get(MechanicsService);
    workshopsService = module.get(WorkshopsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if car does not exist', async () => {
      carsService.findOne.mockResolvedValue(null);

      const dto: any = { roomId: 99, receptionistId: 1, workshopId: 1, mileage: 10000 };
      await expect(service.create(dto)).rejects.toThrow();
    });
  });
});