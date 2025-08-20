import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

import { ActivatedRoute, Router } from '@angular/router';
import { ExamsMockService, FinalExam } from '../exams-mock.service';

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
    CommonModule, FormsModule,
    TableModule, Button, InputTextModule, InputNumberModule, CheckboxModule
  ],
  templateUrl: './final-exam-page.html',
  styleUrls: ['./final-exam-page.scss'],
})
export class FinalExamPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ExamsMockService);

  examId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
  exam = signal<FinalExam | null>(null);

  // alumnos mock (MVP)
  rows = signal<Row[]>([]);

  ngOnInit(): void {
    const ex = this.svc.getFinal(this.examId);
    this.exam.set(ex || null);

    // Datos de alumnos mock (podemos luego hidratar desde subject_students)
    this.rows.set([
      { id: 1, name: 'Juan Pérez', enrolled: true,  enrolled_at: '2025-12-01', score: 8,   notes: '' },
      { id: 2, name: 'Ana Rodríguez', enrolled: false, enrolled_at: null,       score: null, notes: 'Consulta' },
      { id: 3, name: 'María Gómez', enrolled: true,  enrolled_at: '2025-12-02', score: 6.5, notes: '' },
      { id: 4, name: 'Luis Romero', enrolled: true,  enrolled_at: '2025-12-03', score: null, notes: '' },
    ]);
  }

  back() {
    // volver a la mesa que contiene este examen
    const tableId = this.exam()?.exam_table_id ?? 0;
    this.router.navigate(['../../table', tableId], { relativeTo: this.route });
  }
}
