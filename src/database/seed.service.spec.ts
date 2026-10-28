import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum.js';
import { Workshop } from '../modules/workshops/entities/workshop.entity.js';
import { Mechanichs } from '../modules/mechanics/entities/mechanichs.entity.js';
import { Car } from '../modules/cars/entities/car.entity.js';
import { User } from '../modules/users/entities/user.entity.js';
import { SeedService } from './seed.service.js';

const buildRepository = () => ({
  count: jest.fn<() => Promise<number>>(),
  insert: jest.fn<(rows: unknown) => Promise<unknown>>(),
  query: jest.fn<(sql: string) => Promise<unknown>>(),
});

const workshopsRepository = buildRepository();
const carsRepository = buildRepository();
const mechanicsRepository = buildRepository();
const usersRepository = buildRepository();

const repositories = [workshopsRepository, carsRepository, mechanicsRepository, usersRepository];

/**
 * The seed reads SEED_USER_PASSWORD and BCRYPT_ROUNDS from .env; a low cost
 * keeps the test fast while the hash is still a real bcrypt hash.
 */
const configService = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, unknown> = {
      seedUserPassword: 'SeedSecret123',
      bcryptRounds: 4,
    };
    return values[key];
  }),
};

describe('SeedService', () => {
  let service: SeedService;

  const seedWithEmptyTables = async () => {
    repositories.forEach((repository) => repository.count.mockResolvedValueOnce(0));
    await service.onApplicationBootstrap();
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Workshop), useValue: workshopsRepository },
        { provide: getRepositoryToken(Car), useValue: carsRepository },
        { provide: getRepositoryToken(Mechanichs), useValue: mechanicsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('is defined and runs when the application boots', () => {
    expect(service).toBeDefined();
    expect(typeof service.onApplicationBootstrap).toBe('function');
  });

  it('does not overwrite a database that already has data', async () => {
    repositories.forEach((repository) => repository.count.mockResolvedValueOnce(3));

    await service.onApplicationBootstrap();

    repositories.forEach((repository) => {
      expect(repository.insert).not.toHaveBeenCalled();
      expect(repository.query).not.toHaveBeenCalled();
    });
    expect(configService.getOrThrow).not.toHaveBeenCalledWith('seedUserPassword');
  });

  it('seeds only the tables that are empty', async () => {
    workshopsRepository.count.mockResolvedValueOnce(3);
    carsRepository.count.mockResolvedValueOnce(0);
    mechanicsRepository.count.mockResolvedValueOnce(0);
    usersRepository.count.mockResolvedValueOnce(0);

    await service.onApplicationBootstrap();

    expect(workshopsRepository.insert).not.toHaveBeenCalled();
    expect(carsRepository.insert).toHaveBeenCalledTimes(1);
    expect(mechanicsRepository.insert).toHaveBeenCalledTimes(1);
    expect(usersRepository.insert).toHaveBeenCalledTimes(1);
  });

  it('creates 3 workshops, 6 cars, 2 mechanics and 4 users', async () => {
    await seedWithEmptyTables();

    const workshops = workshopsRepository.insert.mock.calls[0][0] as { id: number; name: string }[];
    const cars = carsRepository.insert.mock.calls[0][0] as { id: number; workshopid: number }[];
    const mechanics = mechanicsRepository.insert.mock.calls[0][0] as { id: number }[];
    const users = usersRepository.insert.mock.calls[0][0] as { username: string }[];

    expect(workshops).toHaveLength(3);
    expect(workshops[0]).toMatchObject({ id: 1, name: 'Arenosa Via 40' });

    expect(cars).toHaveLength(6);
    expect(cars.map((car) => car.workshopid)).toEqual([1, 1, 1, 2, 2, 3]);

    expect(mechanics).toHaveLength(2);

    expect(users).toHaveLength(4);
    expect(users.map((user) => user.username)).toEqual([
      'admin-1',
      'coordinator-1',
      'mechanic-1',
      'mechanic-2',
    ]);
  });

  it('stores the password as a bcrypt hash of SEED_USER_PASSWORD', async () => {
    await seedWithEmptyTables();

    const users = usersRepository.insert.mock.calls[0][0] as {
      username: string;
      passwordHash: string;
    }[];

    for (const user of users) {
      expect(user.passwordHash).not.toBe('SeedSecret123');
      expect(bcrypt.compareSync('SeedSecret123', user.passwordHash)).toBe(true);
    }
  });

  it('links the mechanic users to the rows of the mechanics table', async () => {
    await seedWithEmptyTables();

    const users = usersRepository.insert.mock.calls[0][0] as {
      username: string;
      role: Role;
      mechanicId: number | null;
    }[];

    expect(users[0]).toMatchObject({ role: Role.ADMIN, mechanicId: 1 });
    expect(users[1]).toMatchObject({ role: Role.TECHNICIAN, mechanicId: 2 });
    expect(users[2]).toMatchObject({ role: Role.TECHNICIAN, mechanicId: 1 });
    expect(users[3]).toMatchObject({ role: Role.TECHNICIAN, mechanicId: 2 });
  });

  it('gives every account the same initial password', async () => {
    await seedWithEmptyTables();

    const users = usersRepository.insert.mock.calls[0][0] as { passwordHash: string }[];
    const hashes = new Set(users.map((user) => user.passwordHash));

    expect(hashes.size).toBe(1);
  });

  it('advances the sequence of every table so the next insert does not collide', async () => {
    await seedWithEmptyTables();

    // Any repository can run raw SQL: all four calls go to the first one.
    const statements = workshopsRepository.query.mock.calls.map(([sql]) => sql);

    expect(statements).toHaveLength(4);
    expect(statements[0]).toContain("setval(pg_get_serial_sequence('workshop', 'id')");
    expect(statements[1]).toContain("setval(pg_get_serial_sequence('cars', 'id')");
    expect(statements[2]).toContain("setval(pg_get_serial_sequence('mechanics', 'id')");
    expect(statements[3]).toContain("setval(pg_get_serial_sequence('users', 'id')");
    expect(statements.every((sql) => sql.includes('MAX(id)'))).toBe(true);
  });
});