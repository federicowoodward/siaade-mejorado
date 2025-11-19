import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ExamsTablesPage } from './exams-tables-page/exams-tables-page';
import { ExamTablePage } from './exam-table-page/exam-table-page';
import { FinalExamPage } from './final-exam-page/final-exam-page';
import { CalendarPage } from './calendar-page/calendar-page';
import { roleCanActivate } from '../../core/guards/role.guard';
import { ROLE } from '../../core/auth/roles';

export const FINAL_EXAMS_ROUTES: Routes = [
  {
    path: '',
    component: ExamsTablesPage,
    canActivate: [
      AuthGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
  },
  {
    path: 'table/:id',
    component: ExamTablePage,
    canActivate: [
      AuthGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
  },
  {
    path: 'final/:id',
    component: FinalExamPage,
    canActivate: [
      AuthGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
  },
  {
    path: 'calendar/:id',
    component: CalendarPage,
    canActivate: [
      AuthGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
  },
];
