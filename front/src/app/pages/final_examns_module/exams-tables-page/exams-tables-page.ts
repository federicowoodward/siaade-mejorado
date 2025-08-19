import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

import { ExamsMockService, ExamTable } from '../exams-mock.service';

@Component({
  selector: 'app-exams-tables-page',
  standalone: true,
  imports: [CommonModule, TableModule, Button, DialogModule, InputTextModule, FormsModule, TooltipModule],
  templateUrl: './exams-tables-page.html',
  styleUrls: ['./exams-tables-page.scss'],
})
export class ExamsTablesPage {
  private svc = inject(ExamsMockService);
  private router = inject(Router);

  tables = signal<ExamTable[]>(this.svc.listTables());

  showDialog = signal(false);
  editingId: number | null = null;
  name = ''; start_date = ''; end_date = '';

  openCreate() {
    this.editingId = null;
    this.name = ''; this.start_date = ''; this.end_date = '';
    this.showDialog.set(true);
  }
  openEdit(t: ExamTable) {
    this.editingId = t.id;
    this.name = t.name; this.start_date = t.start_date; this.end_date = t.end_date;
    this.showDialog.set(true);
  }
  confirmDialog() {
    if (!this.name || !this.start_date || !this.end_date) { this.showDialog.set(false); return; }
    if (this.editingId) {
      this.svc.updateTable(this.editingId, { name: this.name, start_date: this.start_date, end_date: this.end_date });
    } else {
      this.svc.createTable({ name: this.name, start_date: this.start_date, end_date: this.end_date, created_by: 'u_sec1' });
    }
    this.tables.set(this.svc.listTables());
    this.showDialog.set(false);
  }

  deleteTable(t: ExamTable) {
    this.svc.deleteTable(t.id);
    this.tables.set(this.svc.listTables());
  }

  openTable(t: ExamTable) {
    this.router.navigate(['/final_examns/table', t.id]);
  }
}
