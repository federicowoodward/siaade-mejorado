import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';

import { ActivatedRoute, Router } from '@angular/router';
import {
  FinalExamStudentsService,
  FinalExamDetailDto,
  FinalExamStudentDto,
} from '../../../core/services/final-exam-students.service';

type Row = {
  id: number;
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
  ],
  templateUrl: './final-exam-page.html',
  styleUrls: ['./final-exam-page.scss'],
})
export class FinalExamPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(FinalExamStudentsService);

  examId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  // header del examen
  exam = signal<FinalExamDetailDto | null>(null);

  // filas de alumnos (derivadas del DTO)
  rows = signal<Row[]>([]);
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
            name: s.name,
            enrolled_at: s.enrolled_at,
            enrolled: !!s.enrolled_at,
            score: s.score,
            notes: s.notes ?? '',
          })
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
