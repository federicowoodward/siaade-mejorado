import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UsersPage } from './users_page/users-page';
import { UserDetailPage } from './user-detail-page/user-detail-page';
import { StudentAcademicStatusPage } from './student-academic-status-page/student-academic-status-page';
import { CreateUserPage } from './create-user-page/create-user-page';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'user_detail/:id',
    component: UserDetailPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'student_academic_status/:id',
    component: StudentAcademicStatusPage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'create',
    component: CreateUserPage,
    canActivate: [AuthGuard, RoleGuard],
  },
];
