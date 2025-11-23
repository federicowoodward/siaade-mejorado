import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService, LocalUser } from '../../../../core/services/auth.service';
import { DrawerVisibility } from '../../../../core/services/drawer_visibility.service';
import {
  ROLE_BY_ID,
  ROLE_LABELS,
  normalizeRole,
} from '../../../../core/auth/roles';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  authService = inject(AuthService);
  drawer = inject(DrawerVisibility);
  userName = '';
  userRoleLabel = '';
  items: MenuItem[] = [];
  isMenuOpen = false;

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName = `${user.name} ${user.lastName}`;
        this.userRoleLabel = this.resolveRoleLabel(user);
      }
    });

    this.items = [
      {
        label: 'Mi perfil',
        icon: 'pi pi-user',
        routerLink: ['/personal-data'],
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        styleClass: 'logout-item',
        command: () => this.authService.logout(),
      },
    ];
  }

  openSidebar() {
    this.drawer.sidebarVisible.set(true);
  }

  private resolveRoleLabel(user: LocalUser | null): string {
    if (!user) return '';
    const role =
      normalizeRole(user.role) ??
      normalizeRole(user.roleId ? ROLE_BY_ID[user.roleId] : null);
    if (role && ROLE_LABELS[role]) {
      return ROLE_LABELS[role];
    }
    return 'Usuario';
  }
}