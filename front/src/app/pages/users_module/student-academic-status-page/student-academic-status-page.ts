import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  AcademicStatus,
  StudentMinimal,
} from '../../../shared/components/academic_status/academic-status-component';
import { ApiService } from '../../../core/services/api.service';
import { ROLE, ROLE_IDS } from '../../../core/auth/roles';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-student-academic-status-page',
  standalone: true,
  imports: [CommonModule, AppBreadcrumbComponent, AcademicStatus, Button],
  template: `
    <div class="m-w-custom flex flex-column gap-3">
      <app-breadcrumb [items]="breadcrumbItems"></app-breadcrumb>
      <div
        class="surface-card border-round p-4 mb-4 flex align-items-center justify-content-between"
      >
        <h2>Situación Académica del Estudiante</h2>
        <p-button
          label="Descargar Situación Académica"
          (onClick)="downloadCertificate()"
        />
      </div>
      <div>
        @if (loading()) {
          <p>Cargando información del usuario...</p>
        } @else if (errorMessage()) {
          <div class="p-4 bg-red-100 text-red-900 border-round">
            <p class="font-bold">Error</p>
            <p>{{ errorMessage() }}</p>
          </div>
        } @else if (student()) {
          <app-academic-status [student]="student()"></app-academic-status>
        }
      </div>
    </div>
  `,
})
export class StudentAcademicStatusPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  // this is a signal we *own* and can .set()
  student = signal<StudentMinimal | undefined>(undefined);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');
  private redirectTimer: number | null = null;

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de usuarios', routerLink: '/users' },
    { label: 'Situación académica del estudiante' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('ID de usuario no proporcionado.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.api.getById('users', id).subscribe({
      next: (u: any) => {
        const data = u.data;

        if (data.id === undefined) {
          this.errorMessage.set('Usuario no encontrado.');
          this.loading.set(false);
          return;
        }

        // Validar que el usuario sea estudiante
        const isStudent =
          data.role?.name === ROLE.STUDENT ||
          data.roleId === ROLE_IDS[ROLE.STUDENT];

        if (!isStudent) {
          console.error(
            '[StudentAcademicStatus] El usuario no es un estudiante:',
            u,
          );
          this.errorMessage.set(
            `El usuario "${data.name} ${data.lastName}" no es un estudiante. Solo se puede consultar la situación académica de estudiantes.`,
          );
          this.loading.set(false);

          return;
        }

        this.student.set({
          id: data.id,
          name: data.name,
          lastName: data.lastName,
          cuil: data.cuil,
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[StudentAcademicStatus] Error al cargar usuario:', err);

        if (err.status === 404) {
          this.errorMessage.set('El usuario no existe o no es un estudiante.');
        } else {
          this.errorMessage.set('Error al cargar la información del usuario.');
        }
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  downloadCertificate() {
    const studentId = this.student()?.id;
    if (!studentId) {
      this.errorMessage.set('No se encontro al estudiante para descargar.');
      return;
    }

    this.api
      .request<Blob>(
        'GET',
        `generatePdf/student-certificate/${studentId}`,
        undefined,
        undefined,
        undefined,
        false,
        'blob',
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'certificado-estudiante.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error(
            '[StudentAcademicStatus] Error al descargar certificado:',
            err,
          );
          this.errorMessage.set('No se pudo descargar el certificado.');
        },
      });
  }
}
