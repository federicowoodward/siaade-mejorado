import { Routes } from "@angular/router";
import { StudentsPage } from "./students_page/students-page";
import { SubjectAcademicSituationPage } from "./subject_academic_situation/subject-academic-situation.page";
import { SubjectsPage } from "./subjects_page/subjects-page";
import { NewSubjectPage } from "./new-subject-page/new-subject-page";
import { CareerPage } from "./career_page/career-page/career-page";
import { roleCanActivate } from "../../core/guards/role.guard";
import { ROLE } from "../../core/auth/roles";

export const SUBJECTS_ROUTES: Routes = [
  {
    path: "",
    component: SubjectsPage,
  },
  {
    path: "students/:subjectId",
    component: StudentsPage,
  },
  {
    path: ":subjectId/academic-situation",
    component: SubjectAcademicSituationPage,
  },
  {
    path: "new",
    component: NewSubjectPage,
    canActivate: [roleCanActivate([ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY])],
  },
  {
    path: "career-data",
    component: CareerPage,
    canActivate: [roleCanActivate([ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY])],
  },
];
