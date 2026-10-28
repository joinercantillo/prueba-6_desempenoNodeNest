import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WorkshopsService } from './workshops.service.js';
import { Workshop } from './entities/workshop.entity.js';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('WorkshopsService', () => {
  let service: WorkshopsService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        {
          provide: getRepositoryToken(Workshop),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkshopsService>(WorkshopsService);
    repository = module.get(getRepositoryToken(Workshop));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a workshop', async () => {
      const dto = { name: 'Arenosa Via 40', location: 'Corridor', address: 'Via 40', city: 'Barranquilla' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(dto);
      repository.save.mockResolvedValue({ id: 1, ...dto, active: true });

      const result = await service.create(dto);
      expect(result).toEqual({ id: 1, ...dto, active: true });
    });

    it('should throw ConflictException if workshop name already exists', async () => {
      const dto = { name: 'Arenosa Via 40', location: 'Corridor', address: 'Via 40', city: 'Barranquilla' };
      repository.findOne.mockResolvedValue({ id: 1, ...dto });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllActive', () => {
    it('should return an array of active workshops', async () => {
      const activeWorkshops = [{ id: 1, name: 'Via 40', active: true }];
      repository.find.mockResolvedValue(activeWorkshops);

      const result = await service.findAllActive();
      expect(result).toEqual(activeWorkshops);
      expect(repository.find).toHaveBeenCalledWith({ where: { active: true } });
    });
  });

  describe('findOne', () => {
    it('should return a workshop by ID', async () => {
      const workshop = { id: 1, name: 'Via 40' };
      repository.findOne.mockResolvedValue(workshop);

      const result = await service.findOne(1);
      expect(result).toEqual(workshop);
    });

    it('should throw NotFoundException if workshop is not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});