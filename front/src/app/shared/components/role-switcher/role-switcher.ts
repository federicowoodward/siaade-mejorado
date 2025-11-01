import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Select } from "primeng/select";
import { PermissionService } from "../../../core/auth/permission.service";
import { ROLE, ROLE_IDS } from "../../../core/auth/roles";

@Component({
  selector: "app-role-switcher",
  template: `
    <div class="flex gap-2 align-items-center">
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
    { label: "Estudiante", value: ROLE.STUDENT },
    { label: "Docente", value: ROLE.TEACHER },
    { label: "Preceptor", value: ROLE.PRECEPTOR },
    { label: "Secretario", value: ROLE.SECRETARY },
    { label: "Secretario directivo", value: ROLE.EXECUTIVE_SECRETARY },
  ];
  role: ROLE = this.roles[0].value;

  private permissions = inject(PermissionService);

  switchRole(newRole: ROLE) {
    this.permissions.setRole(newRole, ROLE_IDS[newRole]);
    this.role = newRole;
  }
}
