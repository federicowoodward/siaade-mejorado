import { Component, effect, inject, signal } from "@angular/core";
import { UsersTableComponent } from "../../../shared/components/users-table/users-table.component";
import { Button } from "primeng/button";
import { Router } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { PermissionService } from "../../../core/auth/permission.service";
import { ROLE, ROLE_BY_ID } from "../../../core/auth/roles";
import { UserRow } from "../../../core/models/users-table.models";
import { mapApiUserToRow } from "../../../shared/adapters/users.adapter";

@Component({
  selector: "app-users-page",
  standalone: true,
  imports: [UsersTableComponent, Button],
  templateUrl: "./users-page.html",
  styleUrl: "./users-page.scss",
})
export class UsersPage {
  private router = inject(Router);
  private api = inject(ApiService);
  private permissions = inject(PermissionService);

  public ROLE = ROLE;
  viewerRole: ROLE | null = this.permissions.currentRole();

  rows = signal<UserRow[]>([]);

  constructor() {
    this.api.getAll("users").subscribe((users) => {
      const mapped = users.map((u) =>
        mapApiUserToRow(u, (id: number) => ROLE_BY_ID[id] ?? null)
      );
      this.rows.set(mapped);
    });

    effect(() => {
      this.viewerRole = this.permissions.currentRole();
    });
  }

  goToNewUser() {
    this.router.navigate(["users/create"]);
  }

  onRowAction(e: { actionId: string; row: UserRow }) {
    const { actionId, row } = e;

    if (actionId === "view") {
      this.router.navigate(["/users/user_detail", row.id]);
    }
    if (actionId === "cert") {
      this.router.navigate(["/users/certificates", row.id]);
    }
    if (actionId === "academic") {
      this.router.navigate(["/users/student_academic_status", row.id]);
    }
    if (actionId === "teacher-subjects") {
      this.router.navigate(["/users/teacher_subjects", row.id]);
    }
  }

  onRowClick(_row: UserRow) {}
}

