import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiBearerAuth()
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
}