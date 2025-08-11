import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StudentsPage } from './students_page/students-page';
import { AttendancePage } from './attendance_page/attendance-page';
import { GradesPage } from './grades_page/grades-page';
import { SubjectsPage } from './subjects_page/subjects-page';
import { NewSubjectPage } from './new-subject-page/new-subject-page';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    component: SubjectsPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'students/:subjectId',
    component: StudentsPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'attendance/:subjectId',
    component: AttendancePage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'grades/:subjectId',
    component: GradesPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'new',
    component: NewSubjectPage,
  },
];
