import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { SubjectPage } from './shared/subject_page/subject-page';
import { StudentsPage } from './shared/students_page/students-page';
import { AttendancePage } from './shared/attendance_page/attendance-page';
import { GradesPage } from './shared/grades_page/grades-page';
import { SubjectsPage } from './subjects_page/subjects-page';
import { NewSubjectPage } from './shared/new-subject-page/new-subject-page';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    component: SubjectsPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'subject/:id',
    component: SubjectPage,
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
