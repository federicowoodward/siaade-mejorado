import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { EnrollmentsPage } from './enrollments_page/enrollments-page';
import { AppointmentsDocumentsPage } from './appointments_documents_page/appointments-documents-page';
import { AcademicStatusPage } from './academic_status_page/academic-status-page';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    children: [
      { path: 'enrollments', component: EnrollmentsPage, canActivate: [AuthGuard, RoleGuard] },
      { path: 'appointments-documents', component: AppointmentsDocumentsPage, canActivate: [AuthGuard, RoleGuard] },
      { path: 'academic-status', component: AcademicStatusPage, canActivate: [AuthGuard, RoleGuard] }
    ]
  }
];
