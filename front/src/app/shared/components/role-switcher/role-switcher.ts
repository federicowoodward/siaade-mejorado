import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { RoleName, RolesService } from '../../../core/services/role.service';

@Component({
  selector: 'app-role-switcher',
  template: `
    <div class="flex gap-2 align-items-center p-2">
      <span class="font-bold mr-2">Rol:</span>
      <p-select
        [(ngModel)]="role"
        [options]="roles"
        (onChange)="switchRole($event.value)"
      />
    </div>
  `,
  standalone: true,
  imports: [Select, FormsModule],
})
export class RoleSwitcherComponent {
  roles = [
    { label: 'Estudiante', value: 'student' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Preceptor', value: 'preceptor' },
    { label: 'Secretario', value: 'secretary' },
    { label: 'Directivo', value: 'directive' },
  ];
  role = this.roles[0].value;

  private rolesService = inject(RolesService);

  switchRole(newRole: string) {
    if (newRole === 'directive') {
      this.rolesService.setRole('secretary', true);
    } else {
      this.rolesService.setRole(newRole as RoleName, false);
    }
    this.role = newRole;
  }

  roleLabel(value: string) {
    if (value === 'directive') return 'secretary - directive';
    return value;
  }
}
