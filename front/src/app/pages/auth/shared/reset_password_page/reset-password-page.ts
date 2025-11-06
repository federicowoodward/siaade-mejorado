import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  form = this.fb.group({
    current: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
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
    return !!this.token && !!current && !!this.passwordValue && !!this.confirmValue && !this.mismatch && this.passwordIssues.length === 0;
  }

  async submit() {
    if (!this.token) {
      this.message.add({ severity: 'warn', summary: 'Atención', detail: 'Falta el token.' });
      return;
    }
    const { current, password, confirm } = this.form.value as { current?: string; password?: string; confirm?: string };
    const issues = this.passwordIssues.slice();
    if (!current || !password || !confirm || password !== confirm || issues.length > 0) {
      if (!current) {
        issues.unshift('Ingresá tu contraseña actual');
      }
      if (password !== confirm) {
        issues.unshift('Las contraseñas no coinciden');
      }
      this.message.add({ severity: 'warn', summary: 'Revisá la contraseña', detail: issues.join(' · ') });
      return;
    }
    this.submitting = true;
    this.auth.confirmPasswordReset(this.token, password, current || undefined).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Listo', detail: 'Tu contraseña fue actualizada.' });
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        const backendMsg = err?.error?.message || err?.message;
        const detail = typeof backendMsg === 'string' && backendMsg.trim().length > 0
          ? backendMsg
          : 'No se pudo actualizar la contraseña.';
        this.message.add({ severity: 'error', summary: 'Error', detail });
      },
      complete: () => (this.submitting = false),
    });
  }
}
