import { Routes } from '@angular/router';
import { UsersPage } from './users_page/users-page';
import { UserDetailPage } from './user-detail-page/user-detail-page';
import { StudentAcademicStatusPage } from './student-academic-status-page/student-academic-status-page';
import { CreateUserPage } from './create-user-page/create-user-page';
import { roleCanActivate } from '../../core/guards/role.guard';
import { ROLE } from '../../core/auth/roles';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersPage,
  },
  {
    path: 'user_detail/:id',
    component: UserDetailPage,
  },
  {
    path: 'student_academic_status/:id',
    component: StudentAcademicStatusPage,
  },
  {
    path: 'create',
    component: CreateUserPage,
    canActivate: [roleCanActivate([ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY])],
  },
];
