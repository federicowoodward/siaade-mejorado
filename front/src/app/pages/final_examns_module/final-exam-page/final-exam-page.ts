import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

import { ActivatedRoute, Router } from '@angular/router';
import { ExamsMockService, FinalExam } from '../exams-mock.service';
import { Button } from 'primeng/button';

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
    TableModule, InputTextModule, InputNumberModule, CheckboxModule, Button
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
      { id: 1, name: 'Juan Pérez', enrolled: true, enrolled_at: '2025-12-01', score: 8, notes: '' },
      { id: 2, name: 'Ana Rodríguez', enrolled: false, enrolled_at: null, score: null, notes: 'Consulta' },
      { id: 3, name: 'María Gómez', enrolled: true, enrolled_at: '2025-12-02', score: 6.5, notes: '' },
      { id: 4, name: 'Luis Romero', enrolled: true, enrolled_at: '2025-12-03', score: null, notes: '' },
    ]);
  }

  back() {
    // volver a la mesa que contiene este examen
    const tableId = this.exam()?.exam_table_id ?? 0;
    this.router.navigate(['../../table', tableId], { relativeTo: this.route });
  }

  onEnrollToggle(row: Row) {
    if (row.enrolled) {
      // Si no hay fecha, seteamos hoy por defecto
      row.enrolled_at = row.enrolled_at ?? this.todayISO();
    } else {
      // Si desinscribe, limpiamos fecha
      row.enrolled_at = null;
    }
  }


  private todayISO(): string {
    const d = new Date();
    // Ajuste a zona local para evitar desfases
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
    // Alternativa sin TZ:
    // return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  }


  displayEnrollment(row: Row): string {
    if (!row.enrolled || !row.enrolled_at) return 'No inscripto';
    return this.formatISODate(row.enrolled_at);
  }

  /** Acepta 'YYYY-MM-DD' o ISO, devuelve 'YYYY-MM-DD' seguro */
  private formatISODate(d: string): string {
    // normalizamos para evitar problemas de timezone/parsers
    // si ya viene 'YYYY-MM-DD', la devolvemos tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return 'No inscripto';

    // ajustar a local sin desfasar
    parsed.setMinutes(parsed.getMinutes() - parsed.getTimezoneOffset());
    return parsed.toISOString().slice(0, 10);
  }
}
