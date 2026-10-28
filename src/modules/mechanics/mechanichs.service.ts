import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mechanichs } from './entities/mechanichs.entity.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanichs)
    private readonly mechanicRepository: Repository<Mechanichs>,
  ) {}

  // Register a new mechanic ensuring email uniqueness
  async create(createMechanicDto: CreateMechanicDto): Promise<Mechanichs> {
    const existingEmail = await this.mechanicRepository.findOne({
      where: { email: createMechanicDto.email },
    });
    
    if (existingEmail) {
      throw new ConflictException(`The email ${createMechanicDto.email} is already registered.`);
    }

    const mechanic = this.mechanicRepository.create({
      ...createMechanicDto,
      active: true,
    });

    return await this.mechanicRepository.save(mechanic);
  }

  // Find all registered mechanics
  async findAll(): Promise<Mechanichs[]> {
    return await this.mechanicRepository.find();
  }

  // Find a specific mechanic by ID
  async findOne(id: number): Promise<Mechanichs> {
    const mechanic = await this.mechanicRepository.findOne({ where: { id } });
    
    if (!mechanic) {
      throw new NotFoundException(`Mechanic with ID ${id} not found.`);
    }
    
    return mechanic;
  }

  // Update mechanic information
  async update(id: number, updateMechanicDto: UpdateMechanicDto): Promise<Mechanichs> {
    const mechanic = await this.findOne(id);

    if (updateMechanicDto.email && updateMechanicDto.email !== mechanic.email) {
      const existing = await this.mechanicRepository.findOne({
        where: { email: updateMechanicDto.email },
      });
      
      if (existing) {
        throw new ConflictException(`The email ${updateMechanicDto.email} is already in use.`);
      }
    }

    Object.assign(mechanic, updateMechanicDto);
    return await this.mechanicRepository.save(mechanic);
  }

  // Toggle active status (logical deletion / inactivation preserving maintenance history)
  async toggleStatus(id: number): Promise<Mechanichs> {
    const mechanic = await this.findOne(id);
    mechanic.active = !mechanic.active;
    return await this.mechanicRepository.save(mechanic);
  }
}