import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UsersPage } from './users_page/users-page';
import { CertificatesPage } from './shared/certificates_page/certificates-page';
import { UserModal } from './shared/user_modal/user-modal';
import { UserDetailPage } from './user-detail-page/user-detail-page';

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
    path: 'certificates',
    component: CertificatesPage,
    canActivate: [AuthGuard, RoleGuard],
  },
];
