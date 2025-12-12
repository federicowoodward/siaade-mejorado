import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ApiService } from '@/core/services/api.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-student-careers-page',
  standalone: true,
  imports: [CommonModule, TableModule, AppBreadcrumbComponent],
  templateUrl: './student-careers-page.html',
})
export class StudentCareersPage implements OnInit {
  private readonly api = inject(ApiService);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Inicio', routerLink: '/welcome' },
    { label: 'Inscripciones', routerLink: '/student-careers' },
  ];

  loading = false;
  rows: Array<{
    studentId: string;
    studentName: string;
    studentLastName: string;
    careerName: string | null;
    legajo: string;
  }> = [];

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    // TODO: llamar al endpoint GET /student-careers y poblar la tabla
    this.api;
    this.loading = false;
  }
}
