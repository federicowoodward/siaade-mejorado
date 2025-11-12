import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-request-password-change',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './request-password-change.html',
  styleUrl: './request-password-change.scss',
})
export class RequestPasswordChangePage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private message = inject(MessageService);

  submitting = signal(false);
  userEmail = signal<string>('');

  ngOnInit() {
    // Obtener el email del usuario actual
    this.auth.getUser().subscribe((user) => {
      if (user?.email) {
        this.userEmail.set(user.email);
      }
    });
  }

  async requestCode() {
    if (this.submitting()) return;

    this.submitting.set(true);

    try {
      const result = await firstValueFrom(
        this.auth.requestPasswordChangeCode(),
      );

      if (result.ok) {
        try {
          sessionStorage.setItem('resetMode', 'change');
        } catch {}
        try {
          sessionStorage.setItem('resetIdentity', this.userEmail());
        } catch {}
        this.router.navigate(['/account/password/change-code'], {
          state: { mode: 'change', identity: this.userEmail() },
        });
        return;
      }

      const summary =
        result.kind === 'network'
          ? 'Sin conexión'
          : result.kind === 'server'
            ? 'Error de servidor'
            : 'Error';
      this.message.add({
        severity: result.kind === 'network' ? 'error' : 'warn',
        summary,
        detail: result.message || 'No pudimos enviar el código',
      });
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/personal-data']);
  }
}
