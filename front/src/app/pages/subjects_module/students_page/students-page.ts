import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { GoBackService } from '../../../core/services/go_back.service';
import { RolesService } from '../../../core/services/role.service';
import { UserRow, Role } from '../../../core/models/users-table.models';
import { mapApiUserToRow } from '../../../shared/adapters/users.adapter';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [CommonModule, UsersTableComponent, ButtonModule],
  templateUrl: './students-page.html',
  styleUrls: ['./students-page.scss'],
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService);
  private roles = inject(RolesService);

  subjectId!: string;
  viewerRole: Role = (this.roles.currentRole() as Role) || 'teacher';
  rows = signal<UserRow[]>([]);

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId')!;

    // Ejemplo: endpoint que trae alumnos de la materia
    this.api
      .getAll(`subjects/${this.subjectId}/students`)
      .subscribe((list: any[]) => {
        const mapped = list.map((u) =>
          mapApiUserToRow(u, (id: number) => {
            const roleName = this.roles.getRoleNameById(id);
            return roleName === null ? undefined : roleName;
          })
        );
        this.rows.set(mapped);
      });
  }

  back(): void {
    this.goBack.back();
  }

  onRowAction(e: { actionId: string; row: UserRow }) {
    if (e.actionId === 'academic') {
      // permitir ver situación académica si corresponde
      // navegar o abrir modal
    }
  }
}
