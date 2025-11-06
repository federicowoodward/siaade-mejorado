// src/app/shared/components/subjects-table/subject-table.component.ts
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CareerCatalogService, SubjectCommissionTeachersDto } from '../../../core/services/career-catalog.service';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { BlockedActionDirective } from '../../directives/blocked-action.directive';
@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, BlockedActionDirective],
  templateUrl: './subjects-table.html',
  styleUrls: ['./subjects-table.scss'],
})
export class SubjectTableComponent implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);
  private api = inject(ApiService);

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

  // Cambio docente
  changeTeacherDialog = signal<{ visible: boolean; loading: boolean; subjectId: number | null; commissionId: number | null }>(
    { visible: false, loading: false, subjectId: null, commissionId: null }
  );
  teacherOptions = signal<{ label: string; value: string }[]>([]);
  selectedNewTeacher: string | null = null;

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

  startChangeTeacher(subjectId: number, commissionId: number, currentTeacherId: string) {
    this.selectedNewTeacher = null;
    this.changeTeacherDialog.set({ visible: true, loading: true, subjectId, commissionId });
    // Reutilizamos datos ya cargados (dialogData) si existen
    const data = this.dialogData();
    const teachersRaw = data?.commissions
      .flatMap(c => c.teachers)
      .filter(t => !!t.teacherId);
    this.teacherOptions.set(teachersRaw?.map(t => ({ label: t.name, value: t.teacherId })) ?? []);
    this.changeTeacherDialog.update(v => ({ ...v, loading: false }));
  }

  closeChangeTeacherDialog() {
    this.changeTeacherDialog.set({ visible: false, loading: false, subjectId: null, commissionId: null });
    this.teacherOptions.set([]);
    this.selectedNewTeacher = null;
  }

  confirmChangeTeacher() {
    const dialog = this.changeTeacherDialog();
    if (!dialog.commissionId || !this.selectedNewTeacher) return;
    this.api.request('PATCH', `subject-commissions/${dialog.commissionId}/teacher`, { teacherId: this.selectedNewTeacher }).subscribe({
      next: () => {
        // Refrescar listado de comisiones/docentes
        if (dialog.subjectId) {
          this.viewComissions(dialog.subjectId);
        }
        this.closeChangeTeacherDialog();
      },
      error: (err: unknown) => {
        console.error('Error cambiando docente', err);
        this.closeChangeTeacherDialog();
      }
    });
  }
}
