// src/app/features/exams/pages/exams-tables-page.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ExamTable } from '../../../core/models/exam_table.model';
import { ExamTablesService } from '../../../core/services/final-exam-tables.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-exams-tables-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    DialogModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
  ],
  templateUrl: './exams-tables-page.html',
  styleUrls: ['./exams-tables-page.scss'],
  providers: [MessageService],
})
export class ExamsTablesPage implements OnInit {
  private svc = inject(ExamTablesService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private auth = inject(AuthService);

  tables = signal<ExamTable[]>([]);
  loading = signal<boolean>(false);

  showDialog = signal(false);
  editingId: number | null = null;
  name = '';
  start_date = '';
  end_date = '';

  ngOnInit() {
    this.reload();
  }

  private reload() {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (rows) => {
        this.tables.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingId = null;
    this.name = '';
    this.start_date = '';
    this.end_date = '';
    this.showDialog.set(true);
  }

  openEdit(t: ExamTable) {
    this.editingId = t.id;
    this.name = t.name;
    this.start_date = t.start_date;
    this.end_date = t.end_date;
    this.showDialog.set(true);
  }

  confirmDialog() {
    if (!this.name || !this.start_date || !this.end_date) {
      this.showDialog.set(false);
      return;
    }


    const payload = {
      name: this.name,
      start_date: this.start_date,
      end_date: this.end_date,
      created_by: this.auth.getUserId(),
    };

    if (this.editingId) {
      this.svc.update(this.editingId, payload).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Actualizado' });
          this.reload();
          this.showDialog.set(false);
        },
        error: () => {
          this.showDialog.set(false);
        },
      });
    } else {
      this.svc.create(payload as any).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Creado' });
          this.reload();
          this.showDialog.set(false);
        },
        error: () => {
          this.showDialog.set(false);
        },
      });
    }
  }

  deleteTable(t: ExamTable) {
    this.svc.delete(t.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Eliminado' });
        this.reload();
      },
      error: () => {},
    });
  }

  openTable(t: ExamTable) {
    this.router.navigate(['/final_examns/table', t.id]);
  }
}
