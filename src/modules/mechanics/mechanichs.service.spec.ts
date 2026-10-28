import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MechanicsService } from './mechanichs.service.js';
import { Mechanichs } from './entities/mechanichs.entity.js';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('MechanicsService', () => {
  let service: MechanicsService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MechanicsService,
        {
          provide: getRepositoryToken(Mechanichs),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MechanicsService>(MechanicsService);
    repository = module.get(getRepositoryToken(Mechanichs));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a mechanic', async () => {
      const dto = { name: 'Maria Rojas', document: '12345', phone: '300123', email: 'maria@arenosa.example' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(dto);
      repository.save.mockResolvedValue({ id: 1, ...dto, active: true });

      const result = await service.create(dto);
      expect(result).toEqual({ id: 1, ...dto, active: true });
    });

    it('should throw ConflictException if email already registered', async () => {
      const dto = { name: 'Maria Rojas', document: '12345', phone: '300123', email: 'maria@arenosa.example' };
      repository.findOne.mockResolvedValue({ id: 1, ...dto });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if mechanic does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});