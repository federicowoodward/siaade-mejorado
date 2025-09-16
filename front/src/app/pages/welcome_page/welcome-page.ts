import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RolesService, RoleName } from '../../core/services/role.service';
import { QuickAccessComponent } from '../../shared/components/quick-access-component/quick-access-component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, QuickAccessComponent], 
  templateUrl: './welcome-page.html',
  styleUrls: ['./welcome-page.scss'],
})
export class WelcomePage implements OnInit {
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);

  public role: RoleName;

  constructor() {
    this.role = this.rolesService.currentRole();
  }

  userName = signal<string>('');
  userRole = computed(() => this.rolesService.currentRole());

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name} ${user.lastName}`);
      }
    });
  }
}