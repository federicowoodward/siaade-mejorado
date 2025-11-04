import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalDataComponent } from '../../../shared/components/personal_data/personal-data-component';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [PersonalDataComponent, CommonModule, Button, FormsModule, ToggleButtonModule],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
})
export class UserDetailPage implements OnInit {
  private goBack = inject(GoBackService)
  private api = inject(ApiService);
  private permissions = inject(PermissionService);
  userId!: string;
  // flags alumno
  isActive = signal<boolean | null>(null);
  canLogin = signal<boolean | null>(null);
  saving = signal(false);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.userId) {
      this.loadFlags(this.userId);
    }
  }

  back(): void {
    this.goBack.back();
  }

  // ---- permisos ----
  canToggleCanLogin(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.PRECEPTOR,
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  canToggleIsActive(): boolean {
    return this.permissions.hasRole(ROLE.EXECUTIVE_SECRETARY);
  }

  // ---- carga de flags ----
  private async loadFlags(id: string): Promise<void> {
    try {
      const resp: any = await firstValueFrom(
        this.api.request('GET', `users/${id}`)
      );
      const data = resp?.data ?? resp;
      const student = data?.student ?? data?.students ?? null;
      const isActive = student?.isActive ?? student?.is_active ?? null;
      const canLogin = student?.canLogin ?? student?.can_login ?? null;
      this.isActive.set(isActive === null ? null : !!isActive);
      this.canLogin.set(canLogin === null ? null : !!canLogin);
    } catch (e) {
      // si falla, dejamos nulls y la UI mostrará disabled
    }
  }

  // ---- acciones ----
  async onToggleCanLogin(next: boolean): Promise<void> {
    if (!this.canToggleCanLogin()) return;
    if (this.isActive() === false) return; // regla
    try {
      this.saving.set(true);
      await firstValueFrom(
        this.api.update('users', this.userId, { 'student.canLogin': !!next })
      );
      this.canLogin.set(!!next);
    } catch (e) {
      // noop
    } finally {
      this.saving.set(false);
    }
  }

  async onToggleIsActive(next: boolean): Promise<void> {
    if (!this.canToggleIsActive()) return;
    try {
      this.saving.set(true);
      const payload: any = { 'student.isActive': !!next };
      if (next === false) payload['student.canLogin'] = false; // regla
      await firstValueFrom(this.api.update('users', this.userId, payload));
      this.isActive.set(!!next);
      if (next === false) this.canLogin.set(false);
    } catch (e) {
      // noop
    } finally {
      this.saving.set(false);
    }
  }
}
