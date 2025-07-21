import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UsersPage } from './users_page/users-page';
import { UsersTable } from './shared/users_table/users-table';
import { CertificatesPage } from './shared/certificates_page/certificates-page';
import { UserModal } from './shared/user_modal/user-modal';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersPage,
    canActivate: [AuthGuard, RoleGuard],
    children: [
      {
        path: 'table',
        component: UsersTable,
        canActivate: [AuthGuard, RoleGuard],
      },
      {
        path: 'modal/:id',
        component: UserModal,
        canActivate: [AuthGuard, RoleGuard],
      },
      {
        path: 'certificates',
        component: CertificatesPage,
        canActivate: [AuthGuard, RoleGuard],
      },
    ],
  },
];
