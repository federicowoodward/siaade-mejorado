import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserApiService } from './user.api.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../../../guards/roles.guard';
import { HierarchyGuard } from '../../../guards/hierarchy.guard';
import { OwnerGuard } from '../../../guards/owner.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserApiController {
  constructor(private readonly service: UserApiService) {}

  // /sign-in - manejado por módulo auth existente; no exponemos aquí

  // /reset-password (POST MVP) - asumimos ruta en módulo auth, no duplicar

  // /secretarie/up
  @Post('secretarie/up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL')
  secretarieUp(@Body() body: any) { return this.service.secretarieUp(body); }

  // /preceptor
  @Post('preceptor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SECRETARIO', 'ADMIN_GENERAL')
  preceptor(@Body() body: any) { return this.service.createPreceptor(body); }

  // /teacher
  @Post('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  teacher(@Body() body: any) { return this.service.createTeacher(body); }

  // /student
  @Post('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  student(@Body() body: any) { return this.service.createStudent(body); }

  // /delete
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  delete(@Param('id') id: string) { return this.service.deleteUser(id); }

  // /edit
  @Put('edit/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard, OwnerGuard)
  @Roles('DOCENTE', 'ALUMNO', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  edit(@Param('id') id: string, @Body() body: any) { return this.service.editUser(id, body); }

  // /list:rol
  @Get('list/:rol')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO', 'PRECEPTOR')
  listByRole(@Param('rol') rol: string) { return this.service.listByRole(rol); }

  // /list-all:rol
  @Get('list-all/:rol')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')
  listAllByRole(@Param('rol') rol: string) { return this.service.listAllByRole(rol); }

  // /list-user:id
  @Get('list-user/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO', 'PRECEPTOR', 'DOCENTE', 'ALUMNO')
  getUser(@Param('id') id: string) { return this.service.getUser(id); }
}
