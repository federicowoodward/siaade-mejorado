import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/components/menu/menu-component';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RoleSwitcherComponent } from './shared/components/role-switcher/role-switcher';
import { DrawerVisibility } from './core/services/drawer_visibility.service';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ButtonModule,
    MenuComponent,
    DrawerModule,
    // RoleSwitcherComponent,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  drawerVisibility = inject(DrawerVisibility);
  authService = inject(AuthService)
  protected title = 'front';

  get sidebarVisible() {
    return this.drawerVisibility.sidebarVisible();
  }
  
  set sidebarVisible(b: boolean) {
    this.drawerVisibility.sidebarVisible.set(b);
  }
}
