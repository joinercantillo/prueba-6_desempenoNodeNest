import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workshop } from './entities/workshop.entity.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepository: Repository<Workshop>,
  ) {}

  // 1 & 2. Register a new workshop
  async create(createWorkshopDto: CreateWorkshopDto): Promise<Workshop> {
    const existingWorkshop = await this.workshopRepository.findOne({
      where: { name: createWorkshopDto.name },
    });

    if (existingWorkshop) {
      throw new ConflictException(`A workshop with the name '${createWorkshopDto.name}' already exists.`);
    }

    const workshop = this.workshopRepository.create({
      ...createWorkshopDto,
      active: createWorkshopDto.active ?? true,
    });

    return await this.workshopRepository.save(workshop);
  }

  // 3. List active workshops only (Protected endpoint requirement)
  async findAllActive(): Promise<Workshop[]> {
    return await this.workshopRepository.find({ where: { active: true } });
  }

  // Optional: List all workshops (if needed for admin management)
  async findAll(): Promise<Workshop[]> {
    return await this.workshopRepository.find();
  }

  // 4. Consult a specific workshop by ID
  async findOne(id: number): Promise<Workshop> {
    const workshop = await this.workshopRepository.findOne({ where: { id } });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found.`);
    }

    return workshop;
  }

  // Update workshop details
  async update(id: number, updateWorkshopDto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);

    Object.assign(workshop, updateWorkshopDto);
    return await this.workshopRepository.save(workshop);
  }

  // 5. Activate or deactivate a workshop (Logical status toggle)
  async toggleStatus(id: number): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.active = !workshop.active;
    return await this.workshopRepository.save(workshop);
  }
}