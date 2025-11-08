import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { UsersTableComponent } from "../../../shared/components/users-table/users-table.component";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../../core/services/api.service";
import { GoBackService } from "../../../core/services/go_back.service";
import { ROLE, ROLE_BY_ID } from "../../../core/auth/roles";
import { RoleService } from "@/core/auth/role.service";
import { UserRow } from "../../../core/models/users-table.models";
import { mapApiUserToRow } from "../../../shared/adapters/users.adapter";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-students-page",
  standalone: true,
  imports: [CommonModule, UsersTableComponent, ButtonModule],
  templateUrl: "./students-page.html",
  styleUrls: ["./students-page.scss"],
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService);
  private roles = inject(RoleService);

  public ROLE = ROLE;
  subjectId!: string;
  rows = signal<UserRow[]>([]);

  get viewerRole(): ROLE | null {
    return this.roles.roles()[0] ?? null;
  }

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get("subjectId")!;

    this.api
      .getAll(`subjects/${this.subjectId}/students`)
      .subscribe((list: any[]) => {
        const mapped = list.map((u) =>
          mapApiUserToRow(u, (id: number) => ROLE_BY_ID[id] ?? null)
        );
        this.rows.set(mapped);
      });
  }

  back(): void {
    this.goBack.back();
  }

  onRowAction(_e: { actionId: string; row: UserRow }) {}
}


