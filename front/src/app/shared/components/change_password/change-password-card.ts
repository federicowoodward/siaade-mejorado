import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './change-password-card.html',
  styleUrl: './change-password-card.scss',
})
export class ChangePasswordCard {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  form = this.fb.group({
    current: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  get current() { return (this.form.get('current')?.value as string) || ''; }
  get password() { return (this.form.get('password')?.value as string) || ''; }
  get confirm() { return (this.form.get('confirm')?.value as string) || ''; }

  get hasUpper() { return /[A-Z]/.test(this.password); }
  get hasLower() { return /[a-z]/.test(this.password); }
  get hasDigit() { return /\d/.test(this.password); }
  get issues(): string[] {
    const out: string[] = [];
    if (this.password.length < 8) out.push('Mínimo 8 caracteres');
    if (!this.hasUpper) out.push('Al menos una mayúscula');
    if (!this.hasLower) out.push('Al menos una minúscula');
    if (!this.hasDigit) out.push('Al menos un número');
    return out;
  }
  get mismatch() { return this.confirm.length > 0 && this.password !== this.confirm; }
  get canSubmit() { return !!this.current && !!this.password && !!this.confirm && !this.mismatch && this.issues.length === 0; }

  submitting = false;

  submit() {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;
    this.auth.changePassword(this.current, this.password).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Listo', detail: 'Contraseña actualizada.' });
        this.form.reset();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo actualizar la contraseña.';
        this.message.add({ severity: 'error', summary: 'Error', detail });
      },
      complete: () => { this.submitting = false; },
    });
  }
}
