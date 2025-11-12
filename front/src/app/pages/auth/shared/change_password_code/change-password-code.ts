import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-change-password-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './change-password-code.html',
  styleUrl: './change-password-code.scss',
})
export class ChangePasswordCodePage implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  userEmail = signal<string>('');
  submitting = signal(false);
  canResend = false;
  resendIn = 30;
  private intervalId: any = null;

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit() {
    // Obtener el email del usuario
    this.auth.getUser().subscribe((user) => {
      if (user?.email) {
        this.userEmail.set(user.email);
      }
    });

    this.startCooldown();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async submit() {
    if (this.form.invalid || this.submitting()) return;

    const { code } = this.form.value;
    this.submitting.set(true);

    try {
      const result = await firstValueFrom(
        this.auth.verifyResetCode(this.userEmail(), code!),
      );

      if (!result.ok) {
        const summary =
          result.kind === 'network'
            ? 'Sin conexión'
            : result.kind === 'server'
              ? 'Error de servidor'
              : 'Código inválido';
        this.message.add({
          severity: result.kind === 'network' ? 'error' : 'warn',
          summary,
          detail: result.message || 'El código es incorrecto o venció.',
        });
        this.submitting.set(false);
        return;
      }

      this.message.add({
        severity: 'success',
        summary: 'Código verificado',
        detail: 'Ahora podés cambiar tu contraseña.',
      });

      this.submitting.set(false);

      // Navegar al reset-password con mode=change
      this.router.navigate(['/auth/reset-password'], {
        queryParams: { token: result.token, mode: 'change' },
      });
    } catch (error) {
      this.message.add({
        severity: 'error',
        summary: 'Código inválido',
        detail: 'El código es incorrecto o venció.',
      });
      this.submitting.set(false);
    }
  }

  async resendCode() {
    if (!this.canResend) return;

    this.canResend = false;
    this.resendIn = 30;

    try {
      const result = await firstValueFrom(
        this.auth.requestPasswordChangeCode(),
      );
      if (result.ok) {
        this.message.add({
          severity: 'success',
          summary: 'Código reenviado',
          detail: 'Revisá tu correo.',
        });
      } else {
        const summary =
          result.kind === 'network'
            ? 'Sin conexión'
            : result.kind === 'server'
              ? 'Error de servidor'
              : 'Atención';
        this.message.add({
          severity: result.kind === 'network' ? 'error' : 'warn',
          summary,
          detail: result.message || 'No pudimos reenviar el código aún.',
        });
      }
    } finally {
      this.startCooldown();
    }
  }

  private startCooldown() {
    this.canResend = false;
    this.resendIn = 30;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.resendIn--;
      if (this.resendIn <= 0) {
        this.canResend = true;
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1000);
  }

  cancel() {
    this.router.navigate(['/personal-data']);
  }
}
