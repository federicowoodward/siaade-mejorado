import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles (paginado)' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRoles(@Query('page') page?: number, @Query('limit') limit?: number) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.rolesService.getRoles({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }
}