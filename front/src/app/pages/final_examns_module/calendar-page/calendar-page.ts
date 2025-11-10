import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsMockService, ExamTable, FinalExam } from '../exams-mock.service';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, TableModule, Button],
  templateUrl: './calendar-page.html',
  styleUrls: ['./calendar-page.scss'],
})
export class CalendarPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ExamsMockService);

  tableId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
  table = signal<ExamTable | null>(null);
  finals = signal<FinalExam[]>([]);

  ngOnInit(): void {
    this.table.set(this.svc.getTable(this.tableId));
    this.finals.set(
      this.svc.listFinalsByTable(this.tableId).sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    );
  }

  back() {
    this.router.navigate(['../table', this.tableId], { relativeTo: this.route });
  }
}
