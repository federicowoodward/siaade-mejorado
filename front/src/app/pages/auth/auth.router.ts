import { Routes } from '@angular/router';
import { AuthPage } from './shared/auth_page/auth-page';
import { ResetPasswordPage } from './shared/reset_password_page/reset-password-page';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthPage,
  },
  {
    path: 'reset-password',
    component: ResetPasswordPage,
  },
];
