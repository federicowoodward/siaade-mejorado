import { Routes } from '@angular/router';
import { EnrollmentsPage } from './enrollments_page/enrollments-page';
import { AcademicStatusPage } from './academic_status_page/academic-status-page';
import { roleCanActivate } from '../../core/guards/role.guard';
import { ROLE } from '../../core/auth/roles';

export const STUDENTS_ROUTES: Routes = [
  {
    path: 'enrollments',
    component: EnrollmentsPage,
    canActivate: [roleCanActivate([ROLE.STUDENT])],
  },
  {
    path: 'academic-status',
    component: AcademicStatusPage,
    canActivate: [roleCanActivate([ROLE.STUDENT])],
  },
];
