import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ROLE } from '../../core/auth/roles';
import { CommonModule } from '@angular/common';
import { QuickAccessComponent } from './quick-access-component/quick-access-component';
import { ImportantNoticesComponent } from './important-notices/important-notices';
import { FirstPasswordChangeModalComponent } from '../../shared/components/first-password-change-modal/first-password-change-modal';
import { RoleLabelPipe } from '../../shared/pipes/role-label.pipe';
import {
  INSTITUTION_NAME,
  SYSTEM_ACRONYM,
  SYSTEM_NAME,
} from '@/shared/constants/branding';
@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [
    CommonModule,
    QuickAccessComponent,
    ImportantNoticesComponent,
    FirstPasswordChangeModalComponent,
    RoleLabelPipe,
  ],
  templateUrl: './welcome-page.html',
  styleUrls: ['./welcome-page.scss'],
})
export class WelcomePage implements OnInit {
  readonly institutionName = INSTITUTION_NAME;
  readonly systemFullName = `${SYSTEM_NAME} (${SYSTEM_ACRONYM})`;
  readonly systemAcronym = SYSTEM_ACRONYM;
  authService = inject(AuthService); // public para template
  private permissions = inject(PermissionService);

  public role: ROLE | null;

  constructor() {
    this.role = this.permissions.role();
  }

  userName = signal<string>('');
  userRole = computed(() => this.permissions.role());
  showPasswordChangeModal = signal(false);

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name ?? ''} ${user.lastName ?? ''}`.trim());
        // Verificar si necesita cambiar la contraseña
        if (user.requiresPasswordChange) {
          this.showPasswordChangeModal.set(true);
        }
      }
    });
  }
}
