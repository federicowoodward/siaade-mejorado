import { Component, effect, inject, signal } from '@angular/core';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { RolesService } from '../../../core/services/role.service';
import { UserRow, Role } from '../../../core/models/users-table.models';
import { mapApiUserToRow } from '../../../shared/adapters/users.adapter';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [UsersTableComponent, Button],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage {
  private router = inject(Router);
  private api = inject(ApiService);
  private roles = inject(RolesService);

  // Role del usuario logueado (sácala de tu auth service)
  viewerRole: Role = this.roles.currentRole() as Role; // ej: 'secretary'

  rows = signal<UserRow[]>([]);

  constructor() {
    this.api.getAll('users').subscribe((users) => {
      const mapped = users.map((u) =>
        mapApiUserToRow(u, (id: number) => {
          const roleName = this.roles.getRoleNameById(id);
          return roleName === null ? undefined : roleName;
        })
      );
      this.rows.set(mapped);
    });
  }

  goToNewUser() {
    this.router.navigate(['users/create']);
  }

  onRowAction(e: { actionId: string; row: UserRow }) {
    const { actionId, row } = e;

    if (actionId === 'view') {
      this.router.navigate(['/users/user_detail', row.id]);
    }
    if (actionId === 'cert') {
      // abrir modal desde acá o navegar a una ruta de certificados
      this.router.navigate(['/users/certificates', row.id]);
    }
    if (actionId === 'academic') {
      this.router.navigate(['/users/student_academic_status', row.id]);
    }
    if (actionId === 'teacher-subjects') {
      this.router.navigate(['/users/teacher_subjects', row.id]);
    }
  }

  onRowClick(row: UserRow) {
    // define comportamiento por defecto al click en la fila (opcional)
  }
}
