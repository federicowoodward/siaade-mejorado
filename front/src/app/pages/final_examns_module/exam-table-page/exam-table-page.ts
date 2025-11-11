import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FinalExamCreateDialogComponent } from '../shared/components/final-exam-create-dialog/final-exam-create-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamTablesService } from '../../../core/services/final-exam-tables.service';
import { FinalExamsService } from '../../../core/services/final-exams.service';
import { ExamTable } from '../../../core/models/exam_table.model';
import { FinalExam } from '../../../core/models/final_exam.model';
import { ExamTableSyncService } from '../../../core/services/exam-table-sync.service';

@Component({
  selector: 'app-exam-table-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    TooltipModule,
    FinalExamCreateDialogComponent,
  ],
  templateUrl: './exam-table-page.html',
  styleUrls: ['./exam-table-page.scss'],
  providers: [MessageService],
})
export class ExamTablePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tablesSvc = inject(ExamTablesService);
  private finalsSvc = inject(FinalExamsService);
  private messages = inject(MessageService);
  private sync = inject(ExamTableSyncService);

  tableId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  table = signal<ExamTable | null>(null);
  finals = signal<FinalExam[]>([]);
  loading = signal<boolean>(false);

  // diálogo
  showCreate = signal(false);

  // límites para el datepicker 24h (se los pasamos al diálogo)
  minDate: Date | null = null;
  maxDate: Date | null = null;

  ngOnInit(): void {
    this.loadTable();
    this.refreshFinals();
  }

  private loadTable() {
    this.tablesSvc.getOne(this.tableId).subscribe({
      next: (t) => {
        this.table.set(t);
        this.minDate = t?.start_date
          ? new Date(t.start_date + 'T00:00:00')
          : null;
        this.maxDate = t?.end_date ? new Date(t.end_date + 'T23:59:59') : null;
      },
      error: () => this.table.set(null),
    });
  }

  refreshFinals() {
    this.loading.set(true);
    this.finalsSvc.listByTable(this.tableId).subscribe({
      next: (rows) => {
        this.finals.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.showCreate.set(true);
  }

  handleCreate(payload: {
    subject_id: number;
    exam_date: string;
    exam_time?: string;
    aula?: string;
  }) {
    this.finalsSvc
      .create({
        final_exam_table_id: this.tableId,
        subject_id: payload.subject_id,
        exam_date: payload.exam_date,
        exam_time: payload.exam_time,
        aula: payload.aula,
      })
      .subscribe({
        next: (created) => {
          this.messages.add({ severity: 'success', summary: 'Final creado' });
          // Optimista: insertar el nuevo examen en el listado inmediatamente
          try {
            const current = this.finals();
            this.finals.set([created, ...current.filter((x) => x.id !== created.id)]);
          } catch {}
          // Sincronizar con backend por si cambia el orden/formato
          this.refreshFinals();
          this.sync.notify({
            action: 'updated',
            mesaId: this.tableId,
            subjectId: payload.subject_id,
          });
          this.showCreate.set(false);
        },
        error: (e) => {
          const raw = e?.error?.message;
          const detail = Array.isArray(raw)
            ? raw.join(' • ')
            : raw ?? 'Ver consola';
          this.messages.add({
            severity: 'error',
            summary: 'Error al crear',
            detail,
          });
          this.showCreate.set(false);
        },
      });
  }

  openFinal(f: FinalExam) {
    this.router.navigate(['final_examns/final', f.id]);
  }

  deleteFinal(f: FinalExam) {
    this.finalsSvc.delete(f.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Final eliminado' });
        this.refreshFinals();
        this.sync.notify({
          action: 'updated',
          mesaId: this.tableId,
          subjectId: f.subject_id,
        });
      },
      error: (e) =>
        this.messages.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: e?.error?.message,
        }),
    });
  }

  back() {
    this.router.navigate(['final_examns']);
  }
}
