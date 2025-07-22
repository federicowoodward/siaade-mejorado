import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RoleName, RolesService } from '../../../core/services/role.service';
import { DrawerVisibility } from '../../../core/services/drawer_visibility.service';

function addCommandToMenu(items: MenuItem[], command: () => void): MenuItem[] {
  return items.map((item) => ({
    ...item,
    command,
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

  /** Diccionario de menús por rol */
  private readonly menuByRole: Record<RoleName, MenuItem[]> = {
    student: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      {
        label: 'Datos personales',
        icon: 'pi pi-user',
        routerLink: ['/personal-data'],
      },
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
      {
        label: 'Datos personales',
        icon: 'pi pi-user',
        routerLink: ['/personal-data'],
      },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
    ],
    preceptor: [
      { label: 'Bienvenida', icon: 'pi pi-home', routerLink: ['/welcome'] },
      {
        label: 'Datos personales',
        icon: 'pi pi-user',
        routerLink: ['/personal-data'],
      },
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
    // Solo cierra si está en modo móvil (drawer visible)
    this.drawerVisibility.closeSidebar();
  }

  constructor() {
    effect(() => {
      const role = this.rolesService.currentRole();
      // Genera el menú con el command agregado en todos los niveles
      this.menuItems.set(
        addCommandToMenu(this.menuByRole[role], () => this.onMenuItemClick())
      );
    });
  }
}
