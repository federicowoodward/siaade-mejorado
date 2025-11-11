import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

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
    if (cur && pwd === cur) issues.push('La nueva no puede ser igual a la actual');
    return issues;
  }
  get hasUpper(): boolean { return /[A-Z]/.test(this.passwordValue); }
  get hasLower(): boolean { return /[a-z]/.test(this.passwordValue); }
  get hasDigit(): boolean { return /\d/.test(this.passwordValue); }
  get mismatch(): boolean {
    return this.confirmValue.length > 0 && this.passwordValue !== this.confirmValue;
  }
  get canSubmit(): boolean {
    const current = (this.form.get('current')?.value as string) || '';
    // En modo recovery no necesitamos contraseña actual
    const needsCurrent = this.mode === 'change';
    const hasCurrentIfNeeded = needsCurrent ? !!current : true;
    return !!this.token && hasCurrentIfNeeded && !!this.passwordValue && !!this.confirmValue && !this.mismatch && this.passwordIssues.length === 0;
  }

  async submit() {
    if (!this.token) {
      this.message.add({ severity: 'warn', summary: 'Atención', detail: 'Falta el token.' });
      return;
    }
    this.serverError = null;
    this.currentError = null;
    const { current, password, confirm } = this.form.value as { current?: string; password?: string; confirm?: string };
    const issues = this.passwordIssues.slice();
    
      // Validar contraseña actual solo si es modo 'change'
      const needsCurrent = this.mode === 'change';
      if ((needsCurrent && !current) || !password || !confirm || password !== confirm || issues.length > 0) {
        if (needsCurrent && !current) {
          issues.unshift('Ingresá tu contraseña actual');
        }
      if (password !== confirm) {
        issues.unshift('Las contraseñas no coinciden');
      }
      this.message.add({ severity: 'warn', summary: 'Revisá la contraseña', detail: issues.join(' · ') });
      return;
    }
    this.submitting = true;
      // Solo enviar current si es modo 'change'
      const currentToSend = this.mode === 'change' ? (current || undefined) : undefined;
      this.auth.confirmPasswordReset(this.token, password, currentToSend).subscribe({
      next: () => {
        this.serverError = null;
        this.currentError = null;
        this.message.add({ severity: 'success', summary: 'Listo', detail: 'Tu contraseña fue actualizada.' });
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        const detail = this.resolveErrorMessage(err);
        const curDetail = this.resolveCurrentFieldError(err) ?? (/(contraseña\s+actual|current\s*password)/i.test(detail) ? detail : null);
        if (curDetail) {
          this.currentError = curDetail;
        } else {
          this.serverError = detail;
          this.message.add({ severity: 'error', summary: 'Error', detail });
        }
        this.submitting = false;
      },
      complete: () => (this.submitting = false),
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as any;
      const message =
        this.normalizeErrorPayload(payload?.message) ??
        this.normalizeErrorPayload(payload?.error) ??
        this.normalizeErrorPayload(payload);

      if (message) {
        return message;
      }

      if (error.status === 0) {
        return 'No pudimos contactar al servidor. Intentá nuevamente.';
      }
      if (error.status === 401) {
        return 'No pudimos validar tu contraseña actual.';
      }
      if (error.status === 400) {
        return 'Hay detalles pendientes en el formulario.';
      }
    }

    const fallback = this.normalizeErrorPayload((error as any)?.message);
    if (fallback) {
      return fallback;
    }

    return 'No se pudo actualizar la contraseña.';
  }

  private normalizeErrorPayload(source: unknown): string | null {
    if (typeof source === 'string') {
      const trimmed = source.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (Array.isArray(source)) {
      const joined = source
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .join(' · ');
      return joined.length > 0 ? joined : null;
    }
    return null;
  }

  private resolveCurrentFieldError(error: unknown): string | null {
    // Dedicado a errores del campo "Contraseña actual"
    const status = (error as any)?.status as number | undefined;
    const payload = (error as any)?.error ?? undefined;
    const raw =
      this.normalizeErrorPayload((payload as any)?.message) ||
      this.normalizeErrorPayload((payload as any)?.error) ||
      this.normalizeErrorPayload(payload) ||
      this.normalizeErrorPayload((error as any)?.message);

    // 401 suele indicar contraseña actual inválida en este flujo
    if (status === 401) {
      if (raw) return raw;
      return 'Contraseña actual incorrecta';
    }

    // Mensajes que mencionan explícitamente la contraseña actual
    if (raw && /(contraseña\s+actual|current\s*password)/i.test(raw)) {
      return raw;
    }
    return null;
  }
}

