import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';

import { Button } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';

import { InputNumberModule } from 'primeng/inputnumber';

import { CheckboxModule } from 'primeng/checkbox';

import { TagModule } from 'primeng/tag';

import { ToastModule } from 'primeng/toast';

import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';

import { CanAnyRoleDirective } from '@/shared/directives/can-any-role.directive';

import { ActivatedRoute, Router } from '@angular/router';

import {
  FinalExamStudentsService,
  FinalExamDetailDto,
  FinalExamStudentDto,
} from '../../../core/services/final-exam-students.service';

import {
  ApiService,
  ToggleEnrollmentResponse,
} from '../../../core/services/api.service';

import { MessageService } from 'primeng/api';

type Row = {
  id: number;

  student_id: string;

  name: string;

  enrolled: boolean;

  enrolled_at: string | null;

  score: number | null;

  notes: string;
};

@Component({
  selector: 'app-final-exam-page',

  standalone: true,

  imports: [
    CommonModule,

    FormsModule,

    TableModule,

    Button,

    InputTextModule,

    InputNumberModule,

    CheckboxModule,

    TagModule,

    BlockedActionDirective,

    ToastModule,

    CanAnyRoleDirective,
  ],

  templateUrl: './final-exam-page.html',

  styleUrls: ['./final-exam-page.scss'],

  providers: [MessageService],
})
export class FinalExamPage implements OnInit {
  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private svc = inject(FinalExamStudentsService);

  private api = inject(ApiService);

  private messages = inject(MessageService);

  examId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  // header del examen

  exam = signal<FinalExamDetailDto | null>(null);

  // filas de alumnos (derivadas del DTO)

  rows = signal<Row[]>([]);

  loadingRow = signal<string | null>(null);

  loading = signal<boolean>(false);

  error = signal<string | null>(null);

  // flags para edición futura (por ahora inputs deshabilitados)

  canEditScores = signal<boolean>(false);

  canEditNotes = signal<boolean>(false);

  ngOnInit(): void {
    this.fetch();
  }

  private fetch() {
    this.loading.set(true);

    this.error.set(null);

    this.svc.getExamDetail(this.examId).subscribe({
      next: (data) => {
        this.exam.set(data);

        const mapped: Row[] = (data.students ?? []).map(
          (s: FinalExamStudentDto) => ({
            id: s.id,

            student_id: s.student_id,

            name: s.name,

            enrolled_at: s.enrolled_at,

            enrolled: !!s.enrolled_at,

            score: s.score,

            notes: s.notes ?? '',
          }),
        );

        this.rows.set(mapped);

        this.loading.set(false);
      },

      error: (e) => {
        console.error('[FinalExamPage] load error', e);

        this.error.set(e?.error?.message ?? 'No se pudo cargar el examen');

        this.loading.set(false);
      },
    });
  }

  back() {
    const tableId = this.exam()?.table_id ?? 0;

    this.router.navigate(['../../table', tableId], { relativeTo: this.route });
  }

  onToggleExamEnrollment(row: Row, action: 'enroll' | 'unenroll') {
    const exam = this.exam();

    if (!exam) {
      return;
    }

    this.loadingRow.set(row.student_id);

    const finalize = () => this.loadingRow.set(null);

    this.api

      .toggleFinalEnrollment({
        finalExamId: exam.id,

        studentId: row.student_id,

        action,
      })

      .subscribe({
        next: (res: ToggleEnrollmentResponse) => {
          const enrolled = !!res?.enrolled;

          row.enrolled = enrolled;

          row.enrolled_at = enrolled ? (res?.enrolled_at ?? null) : null;

          const dateLabel = res?.enrolled_at
            ? new Date(res.enrolled_at).toLocaleString()
            : '';

          this.toastOk(
            enrolled
              ? `Alumno inscripto${dateLabel ? ` (${dateLabel})` : ''}`
              : 'Alumno desinscripto',
          );
        },

        error: (err: unknown) => {
          console.error('Error toggling exam enrollment', err);

          this.toastErr('No se pudo actualizar la inscripción');

          finalize();
        },

        complete: finalize,
      });
  }

  private toastOk(summary: string) {
    this.messages.add({ severity: 'success', summary });
  }

  private toastErr(detail: string) {
    this.messages.add({ severity: 'error', summary: 'Error', detail });
  }

  // helpers para el tag de estado

  isAprobado(r: Row) {
    return r.score != null && r.score >= 6;
  }

  isDesaprobado(r: Row) {
    return r.score != null && r.score < 6;
  }

  isInscripto(r: Row) {
    return r.score == null && !!r.enrolled_at;
  }
}
