import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { DrawerVisibility } from '../../../../core/services/drawer_visibility.service';
import { ROLE } from '@/core/auth/roles';
import { PermissionService } from '@/core/auth/permission.service';
import { RoleLabelPipe } from '@/shared/pipes/role-label.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule, RoleLabelPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  authService = inject(AuthService);
  private permissions = inject(PermissionService);
  drawer = inject(DrawerVisibility);
  userName = '';
  userRoleName = '';
  items: MenuItem[] = [];
  isMenuOpen = false;

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName = `${user.name} ${user.lastName}`;
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
        command: () => this.authService.logout(),
        styleClass: 'logout-item', 
      },
    ];
  }

  openSidebar() {
    this.drawer.sidebarVisible.set(true);
  }

  userRole(): ROLE | null {
    return this.permissions.currentRole();
  }
}
