import { Routes } from '@angular/router';
import { AuthPage } from './shared/auth_page/auth-page';
import { ResetPasswordPage } from './shared/reset_password_page/reset-password-page';
import { ResetCodePage } from './shared/reset_code_page/reset-code-page';
import { RequestPasswordChangePage } from './shared/request_password_change/request-password-change';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthPage,
  },
  {
    path: 'reset-password',
    component: ResetPasswordPage,
  },
  {
    path: 'reset-code',
    component: ResetCodePage,
  },
  {
    path: 'request-password-change',
    component: RequestPasswordChangePage,
  },
];
