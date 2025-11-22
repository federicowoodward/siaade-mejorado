import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './pages/auth/auth.router';
import { SUBJECTS_ROUTES } from './pages/subjects_module/subjects.router';
import { USERS_ROUTES } from './pages/users_module/users.router';
import { STUDENTS_ROUTES } from './pages/students_module/students.router';
import { WelcomePage } from './pages/welcome_page/welcome-page';
import { PersonalDataPage } from './pages/personal_data_page/personal-data-page';
import { AuthGuard } from './core/guards/auth.guard';
import { UnAuthGuard } from './core/guards/unauth.guard';
import { FINAL_EXAMS_ROUTES } from './pages/final_examns_module/final_examns_module.routes';
import { NoticesPageComponent } from './pages/notices_page/notices_page.component';
import { roleCanActivate } from './core/guards/role.guard';
import { ROLE } from './core/auth/roles';
import { MesasListComponent } from './pages/students_module/enrollments_page/mesas/mesas-list.component';
import { AcademicStatusComponent } from './pages/students_module/academic_status_page/situacion-academica/academic-status.component';
import { SubjectStatusDetailComponent } from './pages/students_module/academic_status_page/situacion-academica/subject-status-detail/subject-status-detail.component';
import { ACCOUNT_ROUTES } from './pages/account/account.routes';
import { forcePasswordChangeGuard } from './core/guards/force-password-change.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [UnAuthGuard],
    children: AUTH_ROUTES,
  },
  {
    path: 'subjects',
    canActivate: [
      AuthGuard,
      forcePasswordChangeGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
    children: SUBJECTS_ROUTES,
  },
  {
    path: 'users',
    canActivate: [
      AuthGuard,
      forcePasswordChangeGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
    children: USERS_ROUTES,
  },
  {
    path: 'students',
    canActivate: [
      AuthGuard,
      forcePasswordChangeGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
    children: STUDENTS_ROUTES,
  },
  {
    path: 'final_examns',
    canActivate: [
      AuthGuard,
      forcePasswordChangeGuard,
      roleCanActivate([
        ROLE.SECRETARY,
        ROLE.EXECUTIVE_SECRETARY,
        ROLE.PRECEPTOR,
        ROLE.TEACHER,
      ]),
    ],
    children: FINAL_EXAMS_ROUTES,
  },
  {
    path: 'welcome',
    component: WelcomePage,
    canActivate: [AuthGuard],
  },
  {
    path: 'personal-data',
    component: PersonalDataPage,
    canActivate: [AuthGuard, forcePasswordChangeGuard],
  },
  {
    path: 'notices',
    component: NoticesPageComponent,
    canActivate: [AuthGuard, forcePasswordChangeGuard],
  },
  {
    path: 'account',
    canActivate: [AuthGuard],
    children: ACCOUNT_ROUTES,
  },
  {
    path: 'alumno',
    canActivate: [AuthGuard, roleCanActivate([ROLE.STUDENT])],
    children: [
      { path: 'mesas', component: MesasListComponent },
      { path: 'situacion-academica', component: AcademicStatusComponent },
      {
        path: 'situacion-academica/:subjectId',
        component: SubjectStatusDetailComponent,
      },
      { path: '', redirectTo: 'mesas', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: '**', redirectTo: 'welcome' },
];
