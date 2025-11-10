import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

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
      const resp: any = await this.auth.requestPasswordChangeCode().toPromise();
      let detail = 'Revisá tu correo para obtener el código de verificación';
      // En dev ahora el backend expone code / token
      if (resp?.code || resp?.token) {
        detail = `DEV → Código: ${resp.code ?? 'n/d'}  Token: ${(resp.token || '').slice(0,18)}...`;
      }
      this.message.add({
        severity: 'success',
        summary: 'Código generado',
        detail,
        life: 8000,
      });
      
      // Navegar a la página de verificación de código
      setTimeout(() => {
        this.router.navigate(['/auth/reset-code'], {
          state: { mode: 'change', identity: this.userEmail() }
        });
      }, 1500);
    } catch (error: any) {
      const msg = error?.error?.message || 'Error al enviar el código';
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: msg,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/personal-data']);
  }
}
