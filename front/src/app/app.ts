import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/components/menu/menu-component';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RoleSwitcherComponent } from './shared/components/role-switcher/role-switcher';
import { DrawerVisibility } from './core/services/drawer_visibility.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ButtonModule,
    MenuComponent,
    DrawerModule,
    RoleSwitcherComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  drawerVisibility = inject(DrawerVisibility);
  protected title = 'front';

  get sidebarVisible() {
    return this.drawerVisibility.sidebarVisible();
  }
  
  set sidebarVisible(v: boolean) {
    this.drawerVisibility.sidebarVisible.set(v);
  }
}
