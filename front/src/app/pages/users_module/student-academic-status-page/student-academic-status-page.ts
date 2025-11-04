// #ASUMIENDO CODIGO: src/app/pages/students/student-academic-status-page/student-academic-status-page.ts
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AcademicStatus,
  StudentMinimal,
} from '../../../shared/components/academic_status/academic-status-component';
import { ApiService } from '../../../core/services/api.service';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';
import { ROLE, ROLE_IDS } from '../../../core/auth/roles';

@Component({
  selector: 'app-student-academic-status-page',
  standalone: true,
  imports: [CommonModule, AcademicStatus, Button],
  template: `
    <div class="m-w-custom flex flex-column gap-3">
      <p-button
        label="Volver a tabla"
        icon="pi-arrow-rigth"
        iconPos="left"
        (onClick)="back()"
      ></p-button>

      <h2>Situación Académica del Estudiante</h2>
      
      @if (loading()) {
        <p>Cargando información del usuario...</p>
      } @else if (errorMessage()) {
        <div class="p-4 bg-red-100 text-red-900 border-round">
          <p class="font-bold">Error</p>
          <p>{{ errorMessage() }}</p>
        </div>
      } @else if (student()) {
        <app-academic-status
          [student]="student()"
        ></app-academic-status>
      }
    </div>
  `,
})
export class StudentAcademicStatusPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService);

  // this is a signal we *own* and can .set()
  student = signal<StudentMinimal | undefined>(undefined);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');
  private redirectTimer: number | null = null;

  constructor(private router: Router) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('ID de usuario no proporcionado.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.api.getById('users/read', id).subscribe({
      next: (u: any) => {
        if (!u?.id) {
          this.errorMessage.set('Usuario no encontrado.');
          this.loading.set(false);
          return;
        }

        // Validar que el usuario sea estudiante
        const isStudent = u.role?.name === ROLE.STUDENT || u.roleId === ROLE_IDS[ROLE.STUDENT];

        if (!isStudent) {
          console.error('[StudentAcademicStatus] El usuario no es un estudiante:', u);
          this.errorMessage.set(
            `El usuario "${u.name} ${u.lastName}" no es un estudiante. Solo se puede consultar la situación académica de estudiantes.`
          );
          this.loading.set(false);

          this.redirectTimer = window.setTimeout(() => this.back(), 3000);
          return;
        }

        this.student.set({
          id: u.id,
          name: u.name,
          lastName: u.lastName,
          cuil: u.cuil,
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

        this.redirectTimer = window.setTimeout(() => this.back(), 3000);
      }
    });
  }

  back(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
    this.router.navigate(["/users"]);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }
}
