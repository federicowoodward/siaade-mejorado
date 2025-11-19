import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  AuthService,
  ConfirmPasswordResetResult,
} from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  token: string | null = null;
  mode: 'recovery' | 'change' = 'recovery'; // recovery = sin contraseña actual, change = con contraseña actual
  serverError: string | null = null;
  currentError: string | null = null;

  form = this.fb.group({
    current: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    // Detectar el modo: si viene 'mode=change', es cambio voluntario (requiere contraseña actual)
    const modeParam = this.route.snapshot.queryParamMap.get('mode');
    this.mode = modeParam === 'change' ? 'change' : 'recovery';

    // Si es modo recuperación, no requerimos contraseña actual
    if (this.mode === 'recovery') {
      this.form.get('current')?.clearValidators();
      this.form.get('current')?.updateValueAndValidity();
    }

    // Limpiar errores al tipear en "Contraseña actual"
    const ctrl = this.form.get('current');
    ctrl?.valueChanges.subscribe(() => {
      this.currentError = null;
      this.serverError = null;
    });
  }

  submitting = false;

  // Getters de ayuda para validaciones visibles en UI
  get passwordValue(): string {
    return (this.form.get('password')?.value as string) || '';
  }
  get confirmValue(): string {
    return (this.form.get('confirm')?.value as string) || '';
  }
  get passwordIssues(): string[] {
    const pwd = this.passwordValue;
    const issues: string[] = [];
    if (pwd.length < 8) issues.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(pwd)) issues.push('Al menos una mayúscula');
    if (!/[a-z]/.test(pwd)) issues.push('Al menos una minúscula');
    if (!/\d/.test(pwd)) issues.push('Al menos un número');
    const cur = (this.form.get('current')?.value as string) || '';
    if (cur && pwd === cur)
      issues.push('La nueva no puede ser igual a la actual');
    return issues;
  }
  get hasUpper(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }
  get hasLower(): boolean {
    return /[a-z]/.test(this.passwordValue);
  }
  get hasDigit(): boolean {
    return /\d/.test(this.passwordValue);
  }
  get mismatch(): boolean {
    return (
      this.confirmValue.length > 0 && this.passwordValue !== this.confirmValue
    );
  }
  get canSubmit(): boolean {
    const current = (this.form.get('current')?.value as string) || '';
    // En modo recovery no necesitamos contraseña actual
    const needsCurrent = this.mode === 'change';
    const hasCurrentIfNeeded = needsCurrent ? !!current : true;
    return (
      !!this.token &&
      hasCurrentIfNeeded &&
      !!this.passwordValue &&
      !!this.confirmValue &&
      !this.mismatch &&
      this.passwordIssues.length === 0
    );
  }

  async submit() {
    if (!this.token) {
      this.message.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Falta el token.',
      });
      return;
    }
    this.serverError = null;
    this.currentError = null;
    const { current, password, confirm } = this.form.value as {
      current?: string;
      password?: string;
      confirm?: string;
    };
    const issues = this.passwordIssues.slice();

    // Validar contraseña actual solo si es modo 'change'
    const needsCurrent = this.mode === 'change';
    if (
      (needsCurrent && !current) ||
      !password ||
      !confirm ||
      password !== confirm ||
      issues.length > 0
    ) {
      if (needsCurrent && !current) {
        issues.unshift('Ingresá tu contraseña actual');
      }
      if (password !== confirm) {
        issues.unshift('Las contraseñas no coinciden');
      }
      this.message.add({
        severity: 'warn',
        summary: 'Revisá la contraseña',
        detail: issues.join(' · '),
      });
      return;
    }
    this.submitting = true;
    // Solo enviar current si es modo 'change'
    const currentToSend =
      this.mode === 'change' ? current || undefined : undefined;
    try {
      const result = await firstValueFrom(
        this.auth.confirmPasswordReset(this.token, password, currentToSend),
      );

      if (result.ok) {
        this.serverError = null;
        this.currentError = null;
        this.message.add({
          severity: 'success',
          summary: 'Listo',
          detail: 'Tu contraseña fue actualizada.',
        });
        await this.router.navigate(['/auth']);
      } else {
        this.handleResetError(result);
      }
    } catch (error) {
      this.handleResetError();
    } finally {
      this.submitting = false;
    }
  }

  private handleResetError(
    failure?: ConfirmPasswordResetResult,
  ): void {
    if (!failure || failure.ok) {
      this.serverError = 'No se pudo actualizar la contraseña.';
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: this.serverError,
      });
      return;
    }

    const detail =
      failure.message || 'No se pudo actualizar la contraseña.';

    if (failure.kind === 'invalid_credentials') {
      this.currentError = detail;
      this.message.add({
        severity: 'warn',
        summary: 'Contraseña actual',
        detail,
      });
      return;
    }

    this.serverError = detail;
    const summary =
      failure.kind === 'network'
        ? 'Sin conexión'
        : failure.kind === 'server'
          ? 'Error de servidor'
          : 'Error';
    this.message.add({
      severity: failure.kind === 'network' ? 'error' : 'warn',
      summary,
      detail,
    });
  }
}
