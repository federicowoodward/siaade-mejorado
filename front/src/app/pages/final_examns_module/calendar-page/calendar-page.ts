import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsMockService, ExamTable, FinalExam } from '../exams-mock.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, AppBreadcrumbComponent, TableModule],
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

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Mesas de examen', routerLink: '/final_examns' },
    { label: 'Calendario' },
  ];

  ngOnInit(): void {
    this.table.set(this.svc.getTable(this.tableId));
    this.finals.set(
      this.svc
        .listFinalsByTable(this.tableId)
        .sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    );
  }

  back() {
    this.router.navigate(['../table', this.tableId], {
      relativeTo: this.route,
    });
  }
}
