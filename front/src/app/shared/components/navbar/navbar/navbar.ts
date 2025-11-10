import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { DrawerVisibility } from '../../../../core/services/drawer_visibility.service';

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
      },
    ];
  }

  openSidebar() {
    this.drawer.sidebarVisible.set(true);
  }
}
