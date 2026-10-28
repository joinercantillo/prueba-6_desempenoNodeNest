import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity.js';
import { CreateCarDto } from './dto/create-car.dto.js';
import { UpdateCarDto } from './dto/update-car.dto.js';
import { CarStatus } from './enums/car-status.enum.js';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  // 4. Registrar vehículo validando placa única
  async create(createCarDto: CreateCarDto): Promise<Car> {
    const existingCar = await this.carRepository.findOne({
      where: { Registration: createCarDto.Registration },
    });

    if (existingCar) {
      throw new ConflictException(`El vehículo con la placa ${createCarDto.Registration} ya está registrado.`);
    }

    const car = this.carRepository.create(createCarDto);
    return await this.carRepository.save(car);
  }

  async findAll(): Promise<Car[]> {
    // Opcional: retornar solo los activos si corresponde
    return await this.carRepository.find({ where: { isActive: true } });
  }

  // 5. Consultar información mediante su identificador (ID) o placa
  async findOne(term: string | number): Promise<Car> {
    let car: Car | null = null;

    if (typeof term === 'number' || !isNaN(Number(term))) {
      car = await this.carRepository.findOne({ where: { id: Number(term) } });
    } else {
      car = await this.carRepository.findOne({ where: { Registration: String(term) } });
    }

    if (!car) {
      throw new NotFoundException(`Vehículo con identificador o placa '${term}' no encontrado.`);
    }

    return car;
  }

  // 6. Actualizar la información del vehículo
  async update(id: number, updateCarDto: UpdateCarDto): Promise<Car> {
    const car = await this.findOne(id);

    // Si intenta actualizar la placa, verificamos que no pertenezca a otro auto
    if (updateCarDto.Registration && updateCarDto.Registration !== car.Registration) {
      const existingCar = await this.carRepository.findOne({
        where: { Registration: updateCarDto.Registration },
      });
      if (existingCar) {
        throw new ConflictException(`La placa ${updateCarDto.Registration} ya está en uso por otro vehículo.`);
      }
    }

    Object.assign(car, updateCarDto);
    return await this.carRepository.save(car);
  }

  // 7. Eliminación lógica o inactivación (evita perder mantenimientos históricos)
  async remove(id: number): Promise<void> {
    const car = await this.findOne(id);
    
    // En lugar de this.carRepository.remove(car), hacemos un soft delete cambiando el estado
    car.isActive = false;
    await this.carRepository.save(car);
  }

  // Add these methods inside CarsService if not already present:
async updateStatus(id: number, status: CarStatus): Promise<Car> {
  const car = await this.findOne(id);
  car.status = status;
  return await this.carRepository.save(car);
}

async updateMileage(id: number, newMileage: number): Promise<Car> {
  const car = await this.findOne(id);
  if (newMileage < car.mileage) {
    throw new BadRequestException(`New mileage (${newMileage}) cannot be lower than current vehicle mileage (${car.mileage}).`);
  }
  car.mileage = newMileage;
  return await this.carRepository.save(car);
}

}