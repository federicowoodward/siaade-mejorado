import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Table } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@/core/services/api.service';
import { GoBackService } from '@/core/services/go_back.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { FormsModule } from '@angular/forms';

type CareerOption = { label: string; value: number };
type EnrollmentState = 'ALL' | 'UNASSIGNED' | 'ASSIGNED';

interface UiStudentCareerRow {
  studentId: string;
  name: string;
  lastName: string;
  fullName: string;
  careerId: number | null;
  careerName: string | null;
}

@Component({
  selector: 'app-inscripciones-materias',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    TableModule,
    SelectModule,
    SelectButtonModule,
    TagModule,
    Button,
    FormsModule,
  ],
  templateUrl: './student-careers-page.html',
})
export class StudentCareersPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly goBack = inject(GoBackService);
  private readonly messages = inject(MessageService);
  dt?: Table;

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Administración', routerLink: '/welcome' },
    { label: 'Inscripciones a materias' },
  ];

  students = signal<UiStudentCareerRow[]>([]);
  careers = signal<CareerOption[]>([]);
  loading = signal<boolean>(false);
  enrollmentState = signal<EnrollmentState>('ALL');
  selectedCareerId = signal<number | null>(null);
  enrollmentOptions: { label: string; value: EnrollmentState }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'No inscriptos', value: 'UNASSIGNED' },
    { label: 'Inscriptos', value: 'ASSIGNED' },
  ];

  filteredStudents = computed(() => {
    const list = this.students();
    const state = this.enrollmentState();
    const careerId = this.selectedCareerId();

    if (state === 'UNASSIGNED') {
      return list.filter((s: UiStudentCareerRow) => s.careerId === null);
    }

    if (state === 'ASSIGNED') {
      if (careerId === null) return [];
      return list.filter((s: UiStudentCareerRow) => s.careerId === careerId);
    }

    return list;
  });

  ngOnInit(): void {
    this.loadCareers();
    this.loadStudentCareers();
  }

  goBackClick(): void {
    this.goBack.back();
  }

  onEnrollmentStateChange(state: EnrollmentState): void {
    this.enrollmentState.set(state);

    this.ensureDefaultCareerSelection();
    this.resetPaging();
  }

  onCareerChange(value: number | null): void {
    this.selectedCareerId.set(value);
    this.resetPaging();
  }

  async loadStudentCareers(): Promise<void> {
    this.loading.set(true);
    this.students.set([]);
    try {
      const resp = await firstValueFrom(
        this.api.request<{ data: any[] }>(
          'GET',
          'student-careers',
          undefined,
          undefined,
          undefined,
          false,
        ),
      );
      const rows = (resp as any)?.data ?? resp ?? [];
      const mapped: UiStudentCareerRow[] = (rows as any[]).map((row) => {
        const name = row.studentName ?? row.name ?? '';
        const lastName = row.studentLastName ?? row.lastName ?? '';
        const fullName = [lastName, name].filter(Boolean).join(', ') || name;
        return {
          studentId: row.studentId,
          name,
          lastName,
          fullName,
          careerId: row.careerId ?? null,
          careerName: row.careerName ?? null,
        };
      });
      this.students.set(mapped);
    } catch (err) {
      console.error(err);
      this.toastError('No se pudieron cargar las inscripciones.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCareers(): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.api.request<{ data: any[] }>(
          'GET',
          'catalogs/careers',
          undefined,
          { limit: 200 },
          undefined,
          false,
        ),
      );
      const rows = (resp as any)?.data ?? resp ?? [];
      const opts: CareerOption[] = (rows as any[]).map((c) => ({
        label: c.careerName || c.name || `Carrera ${c.id}`,
        value: c.id,
      }));
      this.careers.set(opts);
      this.ensureDefaultCareerSelection();
    } catch (err) {
      console.error(err);
      this.toastError('No se pudieron cargar las carreras.');
    }
  }

  async onAssign(row: UiStudentCareerRow): Promise<void> {
    if (this.enrollmentState() === 'ASSIGNED' && this.selectedCareerId() === null) {
      this.toastError('Seleccioná una carrera para inscribir.');
      return;
    }
    const careerId = this.selectedCareerId();
    if (!careerId) {
      this.toastError('Seleccioná una carrera para inscribir.');
      return;
    }
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.api.request('POST', 'student-careers/assign', {
          studentId: row.studentId,
          careerId,
        }),
      );
      this.toastOk('Alumno inscripto a la carrera.');
      await this.loadStudentCareers();
    } catch (err) {
      console.error(err);
      this.toastError('No se pudo inscribir al alumno.');
    } finally {
      this.loading.set(false);
    }
  }

  async onUnassign(row: UiStudentCareerRow): Promise<void> {
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.api.request('POST', 'student-careers/update', {
          studentId: row.studentId,
          careerId: null,
        }),
      );
      this.toastOk('Alumno desinscripto de la carrera.');
      await this.loadStudentCareers();
    } catch (err) {
      console.error(err);
      this.toastError('No se pudo desinscribir al alumno.');
    } finally {
      this.loading.set(false);
    }
  }

  private toastOk(summary: string): void {
    this.messages.add({ severity: 'success', summary });
  }

  private toastError(detail: string): void {
    this.messages.add({ severity: 'error', summary: 'Error', detail });
  }

  private ensureDefaultCareerSelection(): void {
    const opts = this.careers();
    if (opts.length === 1 && this.selectedCareerId() === null) {
      this.selectedCareerId.set(opts[0].value);
    }
  }

  private resetPaging(): void {
    if (this.dt) {
      this.dt.first = 0;
    }
  }
}
