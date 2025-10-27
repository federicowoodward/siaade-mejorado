import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StudentsPage } from './students_page/students-page';
import { GradesPage } from './grades_page/grades-page';
import { SubjectsPage } from './subjects_page/subjects-page';
import { NewSubjectPage } from './new-subject-page/new-subject-page';
import { CareerPage } from './career_page/career-page/career-page';

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
    path: 'grades/:subjectId',
    component: GradesPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'new',
    component: NewSubjectPage,
  },
  {
    path: 'career-data',
    component: CareerPage,
    canActivate: [AuthGuard, RoleGuard],
  },
];
