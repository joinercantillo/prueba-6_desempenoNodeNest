import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Workshop } from './entities/workshop.entity.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('Workshops')
@ApiSecurity('API Key')
@ApiSecurity('User')
@Controller('Workshops')
export class WorkshopController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Register a new workshop', description: 'Allows an administrator to register a new workshop branch.' })
  @ApiCreatedResponse({ description: 'Workshop successfully registered.' })
  @ApiConflictResponse({ description: 'Workshop name already exists.' })
  create(@Body() createWorkshopDto: CreateWorkshopDto): Promise<Workshop> {
    return this.workshopsService.create(createWorkshopDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'List active workshops', description: 'Exposes a protected endpoint to list all currently operating (active) workshops.' })
  @ApiOkResponse({ description: 'List of active workshops retrieved successfully.' })
  findAllActive(): Promise<Workshop[]> {
    return this.workshopsService.findAllActive();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Find a specific workshop by ID', description: 'Retrieves detailed information of a single workshop branch.' })
  @ApiOkResponse({ description: 'Workshop found.' })
  @ApiNotFoundResponse({ description: 'Workshop not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Workshop> {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update workshop information', description: 'Allows an administrator to modify workshop details.' })
  @ApiOkResponse({ description: 'Workshop updated successfully.' })
  @ApiNotFoundResponse({ description: 'Workshop not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkshopDto: UpdateWorkshopDto,
  ): Promise<Workshop> {
    return this.workshopsService.update(id, updateWorkshopDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a workshop', description: 'Toggles the operational status of a workshop branch.' })
  @ApiOkResponse({ description: 'Workshop status toggled successfully.' })
  @ApiNotFoundResponse({ description: 'Workshop not found.' })
  toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<Workshop> {
    return this.workshopsService.toggleStatus(id);
  }
}