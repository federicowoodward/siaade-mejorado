import { Component, effect, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { PermissionService } from "../../../core/auth/permission.service";
import { ROLE } from "../../../core/auth/roles";
import { NoticesService, Notice } from "../../../core/services/notices.service";
import { Card } from "primeng/card";

interface QuickAccess {
  label: string;
  icon: string;
  description: string;
  route: string[];
}

@Component({
  selector: "app-quick-access",
  standalone: true,
  imports: [CommonModule, Card, RouterModule],
  templateUrl: "./quick-access-component.html",
  styleUrls: ["./quick-access-component.scss"],
})
export class QuickAccessComponent {
  private permissions = inject(PermissionService);
  private router = inject(Router);
  private noticesSrv = inject(NoticesService);
  public ROLE = ROLE;

  accesses = signal<QuickAccess[]>([]);

  userRole(): ROLE | null {
    return this.permissions.currentRole();
  }

  private readonly accessesByRole: Record<ROLE, QuickAccess[]> = {
    [ROLE.STUDENT]: [
      {
        label: "Ver Materias",
        icon: "pi pi-book",
        description: "Consulta tus materias inscritas y su informacion.",
        route: ["/students/subjects"],
      },
      {
        label: "Situacion Academica",
        icon: "pi pi-chart-line",
        description: "Revisa tus notas y promedios actuales.",
        route: ["/students/academic-status"],
      },
      {
        label: "Inscripciones a Finales",
        icon: "pi pi-pencil",
        description: "Inscribite o cancela inscripcion a examenes finales.",
        route: ["/students/enrollments"],
      },
    ],
    [ROLE.TEACHER]: [
      {
        label: "Mis Materias",
        icon: "pi pi-briefcase",
        description: "Gestiona las materias a tu cargo.",
        route: ["/subjects"],
      },
      {
        label: "Finales",
        icon: "pi pi-book",
        description: "Consulta y administra mesas de examen.",
        route: ["/final_examns"],
      },
      {
        label: "Usuarios",
        icon: "pi pi-users",
        description: "Visualiza informacion de los estudiantes.",
        route: ["/users"],
      },
    ],
    [ROLE.PRECEPTOR]: [
      {
        label: "Materias",
        icon: "pi pi-briefcase",
        description: "Consulta materias y asistencia.",
        route: ["/subjects"],
      },
      {
        label: "Usuarios",
        icon: "pi pi-users",
        description: "Accede a datos de estudiantes.",
        route: ["/users"],
      },
    ],
    [ROLE.SECRETARY]: [
      {
        label: "Materias",
        icon: "pi pi-briefcase",
        description: "Gestiona el listado de materias y correlativas.",
        route: ["/subjects"],
      },
      {
        label: "Usuarios",
        icon: "pi pi-users",
        description: "Administra cuentas y datos de usuarios.",
        route: ["/users"],
      },
      {
        label: "Finales",
        icon: "pi pi-book",
        description: "Crea y administra mesas de examen.",
        route: ["/final_examns"],
      },
    ],
    [ROLE.EXECUTIVE_SECRETARY]: [
      {
        label: "Materias",
        icon: "pi pi-briefcase",
        description: "Gestiona el listado de materias y correlativas.",
        route: ["/subjects"],
      },
      {
        label: "Usuarios",
        icon: "pi pi-users",
        description: "Administra cuentas y datos de usuarios.",
        route: ["/users"],
      },
      {
        label: "Finales",
        icon: "pi pi-book",
        description: "Crea y administra mesas de examen.",
        route: ["/final_examns"],
      },
    ],
  };

  constructor() {
    effect(() => {
      const role = this.permissions.currentRole();
      this.accesses.set(role ? this.accessesByRole[role] ?? [] : []);
    });
  }

  navigate(route: string[]) {
    this.router.navigate(route).then((ok) => {
      if (!ok)
        console.warn(
          "Navigation was canceled, check guards or path:",
          route
        );
    });
  }

  role = this.permissions.role;
  allNotices = this.noticesSrv.notices;

  noticesForHome = computed<Notice[]>(() => {
    const role = this.role();
    const all = this.allNotices();
    if (!role) return all;
    if (role === ROLE.PRECEPTOR || role === ROLE.SECRETARY || role === ROLE.EXECUTIVE_SECRETARY) {
      return all;
    }
    return all.filter((n) => n.visibleFor === role);
  });

  stats = [
    { label: "Materias activas", value: 5 },
    { label: "Examenes proximos", value: 2 },
    { label: "Usuarios nuevos", value: 12 },
  ];
}

