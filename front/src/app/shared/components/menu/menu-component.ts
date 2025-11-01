import { Component, effect, inject, signal } from "@angular/core";
import { MenuItem } from "primeng/api";
import { Menu } from "primeng/menu";
import { ToastModule } from "primeng/toast";
import { PermissionService } from "../../../core/auth/permission.service";
import { ROLE } from "../../../core/auth/roles";
import { DrawerVisibility } from "../../../core/services/drawer_visibility.service";
import { AuthService } from "../../../core/services/auth.service";

function addCommandToMenu(items: MenuItem[], command: () => void): MenuItem[] {
  return items.map((item) => ({
    ...item,
    command: item.command ?? command,
    ...(item.items ? { items: addCommandToMenu(item.items, command) } : {}),
  }));
}

@Component({
  selector: "app-menu-component",
  imports: [Menu, ToastModule],
  templateUrl: "./menu-component.html",
  styleUrl: "./menu-component.scss",
  standalone: true,
})
export class MenuComponent {
  menuItems = signal<MenuItem[]>([]);
  private permissions = inject(PermissionService);
  private drawerVisibility = inject(DrawerVisibility);
  private authService = inject(AuthService);

  private readonly generalMenuItems: MenuItem[] = [];

  private readonly menuByRole: Record<ROLE, MenuItem[]> = {
    [ROLE.STUDENT]: [
      { label: "Inicio", icon: "pi pi-home", routerLink: ["/welcome"] },
      {
        label: "Inscripciones",
        icon: "pi pi-pencil",
        routerLink: ["/students/enrollments"],
      },
      {
        label: "Documentacion",
        icon: "pi pi-calendar",
        routerLink: ["/students/appointments-documents"],
      },
      {
        label: "Situacion academica",
        icon: "pi pi-book",
        routerLink: ["/students/academic-status"],
      },
      { label: "Avisos", icon: "pi pi-bell", routerLink: ["/notices"] },
    ],
    [ROLE.TEACHER]: [
      { label: "Inicio", icon: "pi pi-home", routerLink: ["/welcome"] },
      { label: "Materias", icon: "pi pi-briefcase", routerLink: ["/subjects"] },
      { label: "Usuarios", icon: "pi pi-users", routerLink: ["/users"] },
      { label: "Finales", icon: "pi pi-book", routerLink: ["/final_examns"] },
      { label: "Avisos", icon: "pi pi-bell", routerLink: ["/notices"] },
    ],
    [ROLE.PRECEPTOR]: [
      { label: "Inicio", icon: "pi pi-home", routerLink: ["/welcome"] },
      { label: "Materias", icon: "pi pi-briefcase", routerLink: ["/subjects"] },
      { label: "Usuarios", icon: "pi pi-users", routerLink: ["/users"] },
      { label: "Finales", icon: "pi pi-book", routerLink: ["/final_examns"] },
      { label: "Avisos", icon: "pi pi-bell", routerLink: ["/notices"] },
    ],
    [ROLE.SECRETARY]: [
      { label: "Inicio", icon: "pi pi-home", routerLink: ["/welcome"] },
      { label: "Materias", icon: "pi pi-briefcase", routerLink: ["/subjects"] },
      { label: "Usuarios", icon: "pi pi-users", routerLink: ["/users"] },
      { label: "Finales", icon: "pi pi-book", routerLink: ["/final_examns"] },
      { label: "Avisos", icon: "pi pi-bell", routerLink: ["/notices"] },
    ],
    [ROLE.EXECUTIVE_SECRETARY]: [
      { label: "Inicio", icon: "pi pi-home", routerLink: ["/welcome"] },
      { label: "Materias", icon: "pi pi-briefcase", routerLink: ["/subjects"] },
      { label: "Usuarios", icon: "pi pi-users", routerLink: ["/users"] },
      { label: "Finales", icon: "pi pi-book", routerLink: ["/final_examns"] },
      { label: "Avisos", icon: "pi pi-bell", routerLink: ["/notices"] },
    ],
  };

  onMenuItemClick() {
    this.drawerVisibility.closeSidebar();
  }

  private mergeWithGeneralMenu(role: ROLE | null): MenuItem[] {
    const roleSpecific = role ? this.menuByRole[role] ?? [] : [];
    return [...roleSpecific, ...this.generalMenuItems];
  }

  constructor() {
    effect(() => {
      const role = this.permissions.role();
      const mergedMenu = this.mergeWithGeneralMenu(role);
      this.menuItems.set(
        addCommandToMenu(mergedMenu, () => this.onMenuItemClick())
      );
    });
  }
}
