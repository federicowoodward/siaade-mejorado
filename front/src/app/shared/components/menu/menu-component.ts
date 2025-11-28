import {
  Component,
  effect,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
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
  styleUrls: ['./menu-component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  standalone: true,
})
export class MenuComponent {
  menuItems = signal<MenuItem[]>([]);
  private permissions = inject(PermissionService);
  private drawerVisibility = inject(DrawerVisibility);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activeUrl = signal<string>('');

  private readonly generalMenuItems: MenuItem[] = [];

  private readonly menuByRole: Record<ROLE, MenuItem[]> = {
    [ROLE.STUDENT]: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/welcome'] },
      {
        label: 'Inscripciones',
        icon: 'pi pi-pencil',
        routerLink: ['/alumno/mesas'],
      },
      {
        label: 'Situacion academica',
        icon: 'pi pi-book',
        routerLink: ['/alumno/situacion-academica'],
      },
    ],
    [ROLE.TEACHER]: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
      { label: 'Finales', icon: 'pi pi-book', routerLink: ['/final_examns'] },
    ],
    [ROLE.PRECEPTOR]: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
      { label: 'Finales', icon: 'pi pi-book', routerLink: ['/final_examns'] },
      { label: 'Avisos', icon: 'pi pi-bell', routerLink: ['/notices'] },
    ],
    [ROLE.SECRETARY]: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
      { label: 'Finales', icon: 'pi pi-book', routerLink: ['/final_examns'] },
      { label: 'Avisos', icon: 'pi pi-bell', routerLink: ['/notices'] },
      {
        label: 'Auditoria',
        icon: 'pi pi-chart-bar',
        routerLink: ['/audit'],
      },
    ],
    [ROLE.EXECUTIVE_SECRETARY]: [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/welcome'] },
      { label: 'Materias', icon: 'pi pi-briefcase', routerLink: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: ['/users'] },
      { label: 'Finales', icon: 'pi pi-book', routerLink: ['/final_examns'] },
      {
        label: 'Auditoria',
        icon: 'pi pi-chart-bar',
        routerLink: ['/audit'],
      },
    ],
  };

  onMenuItemClick() {
    this.drawerVisibility.closeSidebar();
  }

  private mergeWithGeneralMenu(role: ROLE | null): MenuItem[] {
    const roleSpecific = role ? (this.menuByRole[role] ?? []) : [];
    return [...roleSpecific, ...this.generalMenuItems];
  }

  private isItemActive(item: MenuItem, currentUrl: string): boolean {
    const link = item.routerLink;
    if (!link) {
      return false;
    }

    let linkUrl: string;

    if (Array.isArray(link)) {
      linkUrl = link.join('');
    } else {
      linkUrl = String(link);
    }

    if (!linkUrl) {
      return false;
    }

    return currentUrl === linkUrl || currentUrl.startsWith(`${linkUrl}/`);
  }

  private withActiveState(items: MenuItem[], currentUrl: string): MenuItem[] {
    return items.map((item) => {
      const isActive = this.isItemActive(item, currentUrl);
      const childItems = item.items
        ? this.withActiveState(item.items, currentUrl)
        : undefined;

      const styleClassParts = [
        item.styleClass ?? '',
        isActive ? 'is-active-menu-item' : '',
      ].filter(Boolean);

      return {
        ...item,
        ...(childItems ? { items: childItems } : {}),
        ...(styleClassParts.length
          ? { styleClass: styleClassParts.join(' ') }
          : {}),
      };
    });
  }

  constructor() {
    this.activeUrl.set(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeUrl.set(event.urlAfterRedirects);
      }
    });

    effect(() => {
      const role = this.permissions.role();
      const currentUrl = this.activeUrl();
      const mergedMenu = this.mergeWithGeneralMenu(role);
      const menuWithActive = this.withActiveState(mergedMenu, currentUrl);
      this.menuItems.set(
        addCommandToMenu(menuWithActive, () => this.onMenuItemClick()),
      );
    });
  }
}
