import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { GoBackService } from '../../../core/services/go_back.service';
import { ROLE, ROLE_BY_ID } from '../../../core/auth/roles';
import { RbacService } from '@/core/rbac/rbac.service';
import { PermissionService } from '@/core/auth/permission.service';
import { UserRow } from '../../../core/models/users-table.models';
import { mapApiUserToRow } from '../../../shared/adapters/users.adapter';
import { ButtonModule } from 'primeng/button';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    UsersTableComponent,
    ButtonModule,
  ],
  templateUrl: './students-page.html',
  styleUrls: ['./students-page.scss'],
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService);
  private rbac = inject(RbacService);
  private permissions = inject(PermissionService);

  public ROLE = ROLE;
  subjectId!: string;
  rows = signal<UserRow[]>([]);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de materias', routerLink: '/subjects' },
    { label: 'Estudiantes de la materia' },
  ];

  get viewerRole(): ROLE {
    const current = this.permissions.currentRole();
    if (current) return current;
    const roles = this.rbac.getSnapshot();
    if (roles && roles.length) {
      return (roles[0] as ROLE) ?? ROLE.SECRETARY;
    }
    return ROLE.SECRETARY;
  }

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId')!;

    this.api
      .getAll(`subjects/${this.subjectId}/students`)
      .subscribe((list: any) => {
        const arr = Array.isArray(list)
          ? list
          : list?.students
            ? list.students
            : Array.isArray(list?.data)
              ? list.data
              : [];
        const mapped = arr.map((u: any) =>
          mapApiUserToRow(u, (id: number) => ROLE_BY_ID[id] ?? null),
        );
        this.rows.set(mapped);
      });
  }

  back(): void {
    this.goBack.back();
  }

  onRowAction(_e: { actionId: string; row: UserRow }) {}
}
