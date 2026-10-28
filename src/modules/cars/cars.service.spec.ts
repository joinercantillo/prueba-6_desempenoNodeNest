import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CarsService } from './cars.service.js';
import { Car } from './entities/car.entity.js';
import { CarStatus } from './enums/car-status.enum.js';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('CarsService', () => {
  let service: CarsService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: getRepositoryToken(Car),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CarsService>(CarsService);
    repository = module.get(getRepositoryToken(Car));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a car by ID', async () => {
      const car = { id: 1, Registration: 'XYZ-123' };
      repository.findOne.mockResolvedValue(car);

      const result = await service.findOne(1);
      expect(result).toEqual(car);
    });

    it('should throw NotFoundException if car not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});