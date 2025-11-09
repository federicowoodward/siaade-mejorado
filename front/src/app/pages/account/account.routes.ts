import { Routes } from '@angular/router';
import { RequestPasswordChangePage } from '../auth/shared/request_password_change/request-password-change';
import { ResetCodePage } from '../auth/shared/reset_code_page/reset-code-page';
import { ResetPasswordPage } from '../auth/shared/reset_password_page/reset-password-page';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: 'password',
    children: [
      { path: 'change-request', component: RequestPasswordChangePage },
      { path: 'change-code', component: ResetCodePage },
      { path: 'reset', component: ResetPasswordPage },
      { path: '', redirectTo: 'change-request', pathMatch: 'full' },
    ],
  },
];
