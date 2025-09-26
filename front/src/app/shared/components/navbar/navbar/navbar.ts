import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

import { AuthService } from '../../../../core/services/auth.service';
import { DrawerVisibility } from '../../../../core/services/drawer_visibility.service';
import { NoticesService, Notice } from '../../../../core/services/notices.service';
import { RolesService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    AvatarModule,
    BadgeModule
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  // Services
  authService = inject(AuthService);
  drawer = inject(DrawerVisibility);
  private router = inject(Router);
  private notices = inject(NoticesService);
  private roles = inject(RolesService);

  // ===== Estado UI =====
  userName = '';
  userInitials = '';
  isMenuOpen = false;
  isNotifOpen = false; // ⬅️ FALTABA ESTA PROPIEDAD

  // Menú usuario
  items: MenuItem[] = [];

  // Links centrales
  centerLinks = [
    { label: 'Inicio',        link: ['/'],                 icon: 'pi pi-home',       exact: true  },
    { label: 'Materias',      link: ['/subjects'],         icon: 'pi pi-book',       exact: false },
    { label: 'Finales',       link: ['/final_examns'],     icon: 'pi pi-calendar',   exact: false },
    { label: 'Inscripciones', link: ['/inscripciones'],    icon: 'pi pi-user-check', exact: false },
  ];

  // Notificaciones (derivadas de avisos, filtradas por rol)
  role = this.roles.currentRole;     // signal<string>
  allNotices = this.notices.notices; // signal<Notice[]>

  notifList = computed<Notice[]>(() => {
    const r = this.role();
    const all = this.allNotices();
    if (!all?.length) return [];
    const visibles = (r === 'preceptor' || r === 'secretary')
      ? all
      : all.filter(n => n.visibleFor === r);
    return [...visibles]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);
  });

  notifCount = computed<number>(() => this.notifList().length);

  ngOnInit(): void {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName = `${user.name} ${user.lastName}`;
        this.userInitials = this.makeInitials(user.name, user.lastName);
      }
    });

    this.items = [
      { label: 'Mi perfil', icon: 'pi pi-user', routerLink: ['/personal-data'] },
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.authService.logout() },
    ];
  }

  openSidebar() {
    this.drawer.sidebarVisible.set(true);
  }

  goToAllNotices() {
    this.router.navigate(['/avisos']);
  }

  private makeInitials(name?: string, last?: string) {
    const a = (name || '').trim()[0] || '';
    const b = (last || '').trim()[0] || '';
    return (a + b).toUpperCase() || 'U';
  }
}
