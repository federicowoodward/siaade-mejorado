import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './create-role.dto';
import { Role } from './role.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('create')
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rolesService.createRole(createRoleDto);  // Crear un nuevo rol
  }

  @Get()
  async getRoles(): Promise<Role[]> {
    return this.rolesService.getRoles();  // Obtener todos los roles
  }

  @Get(':id')
  async getRoleById(@Param('id') id: string): Promise<Role> {
    return this.rolesService.getRoleById(id);  // Obtener un rol por su ID
  }
}