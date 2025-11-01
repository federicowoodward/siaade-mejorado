// src/app/shared/components/subjects-table/subject-table.component.ts
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import {
  CareerCatalogService,
  SubjectCommissionTeachersDto,
} from '../../../core/services/career-catalog.service';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule],
  templateUrl: './subjects-table.html',
  styleUrls: ['./subjects-table.scss'],
})
export class SubjectTableComponent implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);

  basicSubjects = signal<
    { id: number; name: string; teacherId: string | null }[]
  >([]);
  private syncSubjects = effect(() => {
    this.basicSubjects.set(this.catalog.basicSubjects());
  });

  ngOnInit(): void {
    const careerId = 1;
    this.catalog.loadCareer(careerId).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  loading = signal(true);

  // Estado del diálogo
  dialogTeachers = signal<{ visible: boolean; subjectId: number | null }>({
    visible: false,
    subjectId: null,
  });
  dialogLoading = signal(false);
  dialogError = signal<string | null>(null);
  dialogData = signal<SubjectCommissionTeachersDto | null>(null);

  // Abre el diálogo y carga comisiones+docentes
  viewComissions(subjectId: number): void {
    this.dialogTeachers.set({ visible: true, subjectId });
    this.dialogLoading.set(true);
    this.dialogError.set(null);
    this.dialogData.set(null);

    this.catalog.getSubjectCommissionTeachers(subjectId).subscribe({
      next: (data) => {
        this.dialogData.set(data);
        this.dialogLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.dialogError.set(
          'No se pudieron cargar las comisiones y docentes.'
        );
        this.dialogLoading.set(false);
      },
    });
  }

  // Cerrar y limpiar estado del diálogo
  closeTeachersDialog(): void {
    this.dialogTeachers.set({ visible: false, subjectId: null });
    this.dialogLoading.set(false);
    this.dialogError.set(null);
    this.dialogData.set(null);
  }

  // Navegar al perfil del docente
  goToTeacher(teacherId: string): void {
    this.router.navigate(['/users', 'user_detail', teacherId]);
  }

  viewStatus(id: number): void {
    this.router.navigate(['/subjects', id, 'academic-situation']);
  }
}
