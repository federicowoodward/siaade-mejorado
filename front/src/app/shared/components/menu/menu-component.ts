import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RoleName, RolesService } from '../../../core/services/role.service';
import { DrawerVisibility } from '../../../core/services/drawer_visibility.service';
import { AuthService } from '../../../core/services/auth.service';

function addCommandToMenu(items: MenuItem[], command: () => void): MenuItem[] {
  return items.map((item) => ({
    ...item,
    command: item.command ?? command,
    ...(item.items ? { items: addCommandToMenu(item.items, command) } : {}),
  }));
}

@Component({
  selector: 'app-menu-component',
  imports: [Menu, ToastModule],
  templateUrl: './menu-component.html',
  styleUrl: './menu-component.scss',
  standalone: true,
})
export class MenuComponent {
  // Signal del menú actual
  menuItems = signal<MenuItem[]>([]);
  private rolesService = inject(RolesService);
  private drawerVisibility = inject(DrawerVisibility);
  private authService = inject(AuthService);

  // menu para agregar elementos generales
  private readonly generalMenuItems: MenuItem[] = [];

  /** Diccionario de menús por rol */
  private readonly menuByRole: Record<RoleName, MenuItem[]> = {
    student: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      {
        label: 'Inscripciones',
        icon: 'pi pi-pencil',
        routerLink: ['/students/enrollments'],
      },
      {
        label: 'Turnos y documentación',
        icon: 'pi pi-calendar',
        routerLink: ['/students/appointments-documents'],
      },
      {
        label: 'Situación académica',
        icon: 'pi pi-book',
        routerLink: ['/students/academic-status'],
      },
    ],
    teacher: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
    ],
    preceptor: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
    ],
    secretary: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
    ],
  };

  onMenuItemClick() {
    this.drawerVisibility.closeSidebar();
  }

  private mergeWithGeneralMenu(role: RoleName): MenuItem[] {
    const roleSpecific = this.menuByRole[role] ?? [];
    return [...roleSpecific, ...this.generalMenuItems];
  }

  constructor() {
    effect(() => {
      const role = this.rolesService.currentRole();
      const mergedMenu = this.mergeWithGeneralMenu(role);
      this.menuItems.set(
        addCommandToMenu(mergedMenu, () => this.onMenuItemClick())
      );
    });
  }
}
