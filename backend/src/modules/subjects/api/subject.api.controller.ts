import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SubjectApiService } from './subject.api.service';
import { JwtAuthGuard } from '../../users/auth/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { HierarchyGuard } from '../../../guards/hierarchy.guard';
import { Roles } from '../../users/auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Subject API')
@ApiBearerAuth()
@Controller('subject')
export class SubjectApiController {
  constructor(private readonly service: SubjectApiService) {}

  // /add-absence
  @Post('add-absence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR')
  addAbsence(@Body() body: { subject_id: number; student_id: string | string[]; date: string }) {
    return this.service.addAbsence(body);
  }

  // /list-absences
  @Post('list-absences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL', 'ALUMNO')
  listAbsences(@Body() body: { subject_id: number; student_id?: string }) {
    return this.service.listAbsences(body);
  }

  // /remove-absence
  @Post('remove-absence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR')
  removeAbsence(@Body() body: { subject_id: number; student_id: string; date: string }) {
    return this.service.removeAbsence(body);
  }

  // /enroll-student
  @Post('enroll-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SECRETARIO', 'PRECEPTOR', 'ADMIN_GENERAL')
  enroll(@Body() body: { subject_id: number; student_id: string | string[] }) {
    return this.service.enroll(body);
  }

  // /unenroll-student
  @Post('unenroll-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SECRETARIO', 'PRECEPTOR', 'ADMIN_GENERAL')
  unenroll(@Body() body: { subject_id: number; student_id: string | string[] }) {
    return this.service.unenroll(body);
  }

  // /create-exam
  @Post('create-exam')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  createExam(@Body() body: { subject_id: number; title?: string; date?: string }) {
    return this.service.createExam(body);
  }

  // /list-exams
  @Post('list-exams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  listExams(@Body() body: { subject_id: number }) {
    return this.service.listExams(body);
  }

  // /list-exam-results
  @Post('list-exam-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL', 'ALUMNO')
  listExamResults(@Body() body: { exam_id: number }) {
    return this.service.listExamResults(body);
  }

  // /edit-exam
  @Put('edit-exam')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  editExam(@Body() body: { exam_id: number; title?: string; date?: string }) {
    return this.service.editExam(body);
  }

  // /delete-exam
  @Delete('delete-exam/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  deleteExam(@Param('id') id: string) {
    return this.service.deleteExam({ exam_id: parseInt(id) });
  }

  // /edit-score
  @Post('edit-score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  editScore(@Body() body: { exam_id: number; student_id: string; score: number }) {
    return this.service.editScore(body);
  }

  // /detail/:id - información completa de la materia
  @Get('detail/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL')
  getDetail(@Param('id') id: string) {
    return this.service.getSubjectDetail(parseInt(id));
  }
}
