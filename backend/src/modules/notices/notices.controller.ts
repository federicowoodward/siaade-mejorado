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
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../users/auth/roles.decorator';

@ApiTags('Notices')
@ApiBearerAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  // Crear post (preceptor/secretaría/admin)
  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('PRECEPTOR', 'SECRETARIO', 'SECRETARIO_DIRECTIVO', 'ADMIN_GENERAL')
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
  @ApiOperation({ summary: 'Listar avisos por audiencia (student/teacher/all)' })
  findAll(@Query('audience') audience?: 'student' | 'teacher' | 'all') {
    return this.service.findAllByAudience(audience);
  }
}
