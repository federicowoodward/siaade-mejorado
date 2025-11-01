import { Routes } from "@angular/router";
import { AUTH_ROUTES } from "./pages/auth/auth.router";
import { SUBJECTS_ROUTES } from "./pages/subjects_module/subjects.router";
import { USERS_ROUTES } from "./pages/users_module/users.router";
import { STUDENTS_ROUTES } from "./pages/students_module/students.router";
import { WelcomePage } from "./pages/welcome_page/welcome-page";
import { PersonalDataPage } from "./pages/personal_data_page/personal-data-page";
import { AuthGuard } from "./core/guards/auth.guard";
import { UnAuthGuard } from "./core/guards/unauth.guard";
import { FINAL_EXAMS_ROUTES } from "./pages/final_examns_module/final_examns_module.routes";
import { NoticesPageComponent } from "./pages/notices_page/notices_page.component";
import { roleCanActivate } from "./core/guards/role.guard";
import { ROLE } from "./core/auth/roles";

export const routes: Routes = [
  {
    path: "auth",
    canActivate: [UnAuthGuard],
    children: AUTH_ROUTES,
  },
  {
    path: "subjects",
    canActivate: [
      AuthGuard,
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
    path: "users",
    canActivate: [
      AuthGuard,
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
    path: "students",
    canActivate: [
      AuthGuard,
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
    path: "final_examns",
    canActivate: [
      AuthGuard,
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
    path: "welcome",
    component: WelcomePage,
    canActivate: [AuthGuard],
  },
  {
    path: "personal-data",
    component: PersonalDataPage,
    canActivate: [AuthGuard],
  },
  {
    path: "notices",
    component: NoticesPageComponent,
    canActivate: [AuthGuard],
  },
  { path: "", redirectTo: "welcome", pathMatch: "full" },
  { path: "**", redirectTo: "welcome" },
];
