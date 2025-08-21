import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { ExamsTablesPage } from './exams-tables-page/exams-tables-page';
import { ExamTablePage } from './exam-table-page/exam-table-page';
import { FinalExamPage } from './final-exam-page/final-exam-page';
import { CalendarPage } from './calendar-page/calendar-page';

export const FINAL_EXAMS_ROUTES: Routes = [
    { path: '', component: ExamsTablesPage, canActivate: [AuthGuard, RoleGuard] },
    { path: 'table/:id', component: ExamTablePage, canActivate: [AuthGuard, RoleGuard] },
    { path: 'final/:id', component: FinalExamPage, canActivate: [AuthGuard, RoleGuard] },
    { path: 'calendar/:id', component: CalendarPage, canActivate: [AuthGuard, RoleGuard] },
];
