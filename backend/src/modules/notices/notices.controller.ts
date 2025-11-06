import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { normalizePagination, buildPageMeta } from "@/shared/utils/pagination";
import { NoticesService } from "./notices.service";
import { CreateNoticeDto } from "./dto/create-notice.dto";
import { UpdateNoticeDto } from "./dto/update-notice.dto";

@ApiTags('Notices')
@ApiBearerAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  // Crear post (preceptor/secretaría/admin)
  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  @ApiOperation({ summary: 'Crear aviso/post' })
  create(@Body() dto: CreateNoticeDto, @Req() req: any) {
    const userId = req.user?.id as string | undefined;
    return this.service.create(dto, userId);
  }

  // Editar post
  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('PRECEPTOR', 'SECRETARIO', 'SECRETARIO_DIRECTIVO', 'ADMIN_GENERAL')
  @ApiOperation({ summary: 'Editar aviso/post' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoticeDto,
  ) {
    return this.service.update(id, dto);
  }

  // Borrar post
  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('PRECEPTOR', 'SECRETARIO', 'SECRETARIO_DIRECTIVO', 'ADMIN_GENERAL')
  @ApiOperation({ summary: 'Eliminar aviso/post' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // Listar posts por audiencia
  @Get()
  @ApiQuery({ name: 'audience', required: false, enum: ['student', 'teacher', 'all'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Listar avisos por audiencia (student/teacher/all)' })
  @ApiOkResponse({
    description: 'Lista paginada de avisos',
    schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, meta: { type: 'object' } } } as any
  })
  async findAll(
    @Query('audience') audience?: 'student' | 'teacher' | 'all',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findAllByAudience(audience, { skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }
}
