import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './create-role.dto';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    try {
      const role = await this.rolesService.createRole(createRoleDto);
      return {
        data: role,
        message: 'Role created successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to create role'
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getRoles() {
    try {
      const roles = await this.rolesService.getRoles();
      return {
        data: roles,
        message: 'Roles retrieved successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to retrieve roles'
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  async getRoleById(@Param('id') id: string) {
    try {
      const role = await this.rolesService.getRoleById(parseInt(id));
      return {
        data: role,
        message: 'Role retrieved successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Failed to retrieve role'
      };
    }
  }
}