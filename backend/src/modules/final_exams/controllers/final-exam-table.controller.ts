import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { FinalExamTableService } from '../services/final-exam-table.service';
import {
  InitFinalExamTableDto,
  EditFinalExamTableDto,
} from '../dto/final-exam-table.dto';

import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

/** ---------- Swagger DTOs de respuesta ---------- */
class FinalExamTableUserDto {
  id!: string;
  name?: string;
  lastName?: string;
  email?: string;
  roleId!: number;
}

class FinalExamTableResponseDto {
  id!: number;
  name!: string;
  startDate!: string;  // YYYY-MM-DD
  endDate!: string;    // YYYY-MM-DD
  createdBy!: string;  // UUID
  createdByUser?: FinalExamTableUserDto;
}

class DeletedResponseDto {
  deleted!: boolean;
}
/** ---------------------------------------------- */

@ApiTags('Finals / Exam Table')
@ApiBearerAuth()
@Controller('finals/exam-table')
export class FinalExamTableController {
  constructor(private readonly svc: FinalExamTableService) {}

  @ApiOperation({ summary: 'Crear mesa de examen' })
  @ApiBody({ type: InitFinalExamTableDto })
  @ApiCreatedResponse({ type: FinalExamTableResponseDto, description: 'Mesa creada' })
  @ApiBadRequestResponse({ description: 'start_date must be <= end_date' })
  @Post('init')
  create(@Body() dto: InitFinalExamTableDto, @Req() req: any) {
    // const createdBy: string = req.user?.sub ?? req.user?.id;
    const createdBy: string = dto.created_by!; // bombero: viene en body por ahora
    return this.svc.init(dto, createdBy);
  }

  @ApiOperation({ summary: 'Editar mesa de examen' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiBody({ type: EditFinalExamTableDto })
  @ApiOkResponse({ type: FinalExamTableResponseDto })
  @ApiBadRequestResponse({ description: 'start_date must be <= end_date o finales fuera de rango' })
  @ApiNotFoundResponse({ description: 'Final exam table not found' })
  @Put('edit/:id')
  edit(@Param('id') id: string, @Body() dto: EditFinalExamTableDto) {
    return this.svc.edit(+id, dto);
  }

  @ApiOperation({ summary: 'Eliminar mesa de examen' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiNotFoundResponse({ description: 'Final exam table not found' })
  @ApiForbiddenResponse({ description: 'Insufficient hierarchy to delete old final exam tables' })
  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    const role = req.user?.role ?? 'PRECEPTOR';
    return this.svc.remove(+id, role);
  }

  @ApiOperation({ summary: 'Listar todas las mesas de examen' })
  @ApiOkResponse({ type: FinalExamTableResponseDto, isArray: true })
  @Get('list')
  listAll() {
    return this.svc.list();
  }

  @ApiOperation({ summary: 'Obtener una mesa de examen por ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiOkResponse({ type: FinalExamTableResponseDto })
  @ApiNotFoundResponse({ description: 'Final exam table not found' })
  @Get('list/:id')
  listOne(@Param('id') id: string) {
    const n = Number(id);
    if (Number.isNaN(n)) throw new BadRequestException('id must be a number');
    return this.svc.list(n);
  }
}
