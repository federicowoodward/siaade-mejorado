import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { ActivatedRoute, Router } from '@angular/router';
import { ExamsMockService, ExamTable, FinalExam } from '../exams-mock.service';

@Component({
  selector: 'app-exam-table-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, DialogModule, InputTextModule,
    Button, TooltipModule
  ],
  templateUrl: './exam-table-page.html',
  styleUrls: ['./exam-table-page.scss'],
})
export class ExamTablePage implements OnInit {
  private svc = inject(ExamsMockService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tableId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  table = signal<ExamTable | null>(null);
  finals = signal<FinalExam[]>([]);

  // diálogo crear examen (MVP)
  showCreate = signal(false);
  subject_name = '';
  exam_date = '';
  aula = '';

  ngOnInit(): void {
    this.table.set(this.svc.getTable(this.tableId));
    this.refreshFinals();
  }

  refreshFinals() {
    this.finals.set(
      this.svc.listFinalsByTable(this.tableId).sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    );
  }

  openCreate() {
    this.subject_name = '';
    this.exam_date = '';
    this.aula = '';
    this.showCreate.set(true);
  }

  confirmCreate() {
    if (!this.subject_name || !this.exam_date) {
      this.showCreate.set(false);
      return;
    }
    this.svc.createFinal({
      exam_table_id: this.tableId,
      subject_id: Math.floor(Math.random() * 1000) + 1, // mock
      subject_name: this.subject_name,
      exam_date: this.exam_date,
      aula: this.aula || undefined,
    });
    this.refreshFinals();
    this.showCreate.set(false);
  }

  openFinal(f: FinalExam) {
    this.router.navigate(['final_examns/final', f.id]);
  }

  openCalendar() {
    this.router.navigate(['final_examns/calendar', this.tableId]);
  }

  deleteFinal(f: FinalExam) {
    this.svc.deleteFinal(f.id);
    this.refreshFinals();
  }

  back() {
    this.router.navigate(['final_examns']);
  }
}
