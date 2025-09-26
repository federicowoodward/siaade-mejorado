import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AUTH_ROUTES } from './pages/auth/auth.router';
import { SUBJECTS_ROUTES } from './pages/subjects_module/subjects.router';
import { USERS_ROUTES } from './pages/users_module/users.router';
import { STUDENTS_ROUTES } from './pages/students_module/students.router';
import { WelcomePage } from './pages/welcome_page/welcome-page';
import { PersonalDataPage } from './pages/personal_data_page/personal-data-page';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UnAuthGuard } from './core/guards/unauth.guard';
import { FINAL_EXAMS_ROUTES } from './pages/final_examns_module/final_examns_module.routes';
import { NoticesPageComponent } from './pages/notices_page/notices_page.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [UnAuthGuard],
    children: AUTH_ROUTES,
  },
  {
    path: 'subjects',
    canActivate: [AuthGuard, RoleGuard],
    children: SUBJECTS_ROUTES,
  },
  {
    path: 'users',
    canActivate: [AuthGuard, RoleGuard],
    children: USERS_ROUTES,
  },
  {
    path: 'students',
    canActivate: [AuthGuard, RoleGuard],
    children: STUDENTS_ROUTES,
  },
  {
    path: 'final_examns',
    canActivate: [AuthGuard, RoleGuard],
    children: FINAL_EXAMS_ROUTES
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
  {
    path: 'notices',
    component: NoticesPageComponent,
    canActivate: [AuthGuard, RoleGuard],
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: '**', redirectTo: 'welcome' },


];
