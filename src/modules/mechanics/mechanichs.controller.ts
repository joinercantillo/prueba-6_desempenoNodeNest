import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { MechanicsService } from './mechanichs.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanichs } from './entities/mechanichs.entity.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('Mechanics')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('Technicians')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Register a new mechanic', description: 'Allows an administrator to register a new mechanic.' })
  @ApiCreatedResponse({ description: 'Mechanic successfully registered.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  create(@Body() createMechanicDto: CreateMechanicDto): Promise<Mechanichs> {
    return this.mechanicsService.create(createMechanicDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'List all registered mechanics', description: 'Retrieves a list of all mechanics in the database.' })
  @ApiOkResponse({ description: 'List of mechanics retrieved successfully.' })
  findAll(): Promise<Mechanichs[]> {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Find a specific mechanic by ID', description: 'Retrieves detailed information of a single mechanic.' })
  @ApiOkResponse({ description: 'Mechanic found.' })
  @ApiNotFoundResponse({ description: 'Mechanic not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Mechanichs> {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update mechanic information', description: 'Allows an administrator to update mechanic data.' })
  @ApiOkResponse({ description: 'Mechanic updated successfully.' })
  @ApiNotFoundResponse({ description: 'Mechanic not found.' })
  @ApiConflictResponse({ description: 'Email already in use.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMechanicDto: UpdateMechanicDto,
  ): Promise<Mechanichs> {
    return this.mechanicsService.update(id, updateMechanicDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a mechanic', description: 'Toggles the active status to prevent future maintenance assignments while preserving history.' })
  @ApiOkResponse({ description: 'Mechanic status toggled successfully.' })
  @ApiNotFoundResponse({ description: 'Mechanic not found.' })
  toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<Mechanichs> {
    return this.mechanicsService.toggleStatus(id);
  }
}