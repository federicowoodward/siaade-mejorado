import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AUTH_ROUTES } from './pages/auth/auth.router';
import { SUBJECTS_ROUTES } from './pages/subjects/subjects.router';
import { USERS_ROUTES } from './pages/users/users.router';
import { STUDENTS_ROUTES } from './pages/students/students.router';
import { WelcomePage } from './pages/welcome_page/welcome-page';
import { PersonalDataPage } from './pages/personal_data_page/personal-data-page';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES,
  },
  {
    path: 'subjects',
    children: SUBJECTS_ROUTES,
  },
  {
    path: 'users',
    children: USERS_ROUTES,
  },
  {
    path: 'students',
    children: STUDENTS_ROUTES,
  },
  {
    path: 'welcome',
    component: WelcomePage,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'personal-data',
    component: PersonalDataPage,
    canActivate: [AuthGuard, RoleGuard],
  },

  // Defaults
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: '**', redirectTo: 'welcome' },
];

