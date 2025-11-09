import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-first-password-change-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './first-password-change-modal.html',
  styleUrl: './first-password-change-modal.scss',
})
export class FirstPasswordChangeModalComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private message = inject(MessageService);

  visible = signal(true);
  submitting = signal(false);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

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
      this.confirmValue.length > 0 &&
      this.passwordValue !== this.confirmValue
    );
  }

  get canSubmit(): boolean {
    return (
      !!this.passwordValue &&
      !!this.confirmValue &&
      !this.mismatch &&
      this.passwordIssues.length === 0
    );
  }

  async submit() {
    if (!this.canSubmit || this.submitting()) return;

    const { password, confirm } = this.form.value;
    if (password !== confirm) {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    this.submitting.set(true);

    try {
      await this.auth.forcePasswordChange(password!);
      this.message.add({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: 'Tu contraseña ha sido cambiada exitosamente',
      });
      this.visible.set(false);
      // Recargar la página o actualizar el estado del usuario
      window.location.reload();
    } catch (error: any) {
      const msg = error?.error?.message || 'Error al cambiar la contraseña';
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: msg,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
