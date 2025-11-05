import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-code-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './reset-code-page.html',
  styleUrl: './reset-code-page.scss',
})
export class ResetCodePage implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private message = inject(MessageService);

  form = this.fb.group({
    identity: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  submitting = false;

  // cooldown para reenviar
  canResend = false;
  resendIn = 30; // segundos
  private intervalId: any = null;

  constructor() {
    // Recuperar identidad del state o sessionStorage
    const nav = this.router.getCurrentNavigation();
    const identityFromNav = (nav?.extras?.state as any)?.identity ?? (history?.state?.identity);
    const identityFromStorage = (() => {
      try { return sessionStorage.getItem('resetIdentity'); } catch { return null; }
    })();
    const identity = identityFromNav || identityFromStorage || '';
    if (identity) {
      this.form.patchValue({ identity });
    }
    this.updateMaskedIdentity();
    // actualizar cuando cambie la identidad (fallback/manual)
    this.form.get('identity')?.valueChanges.subscribe(() => this.updateMaskedIdentity());
    // Iniciar cooldown automático
    this.startCooldown();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  submit() {
    if (this.form.invalid || this.submitting) return;
    const { identity, code } = this.form.value;
    this.submitting = true;
    this.auth.verifyResetCode(identity!, code!).subscribe({
      next: (resp) => {
        const token = resp?.token;
        if (!token) {
          this.message.add({ severity: 'warn', summary: 'Atención', detail: 'No se pudo verificar el código.' });
          this.submitting = false;
          return;
        }
        this.message.add({ severity: 'success', summary: 'Código verificado', detail: 'Continuá para crear tu nueva contraseña.' });
        this.router.navigate(['/auth/reset-password'], { queryParams: { token } });
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Código inválido', detail: 'El código es incorrecto o venció.' });
        this.submitting = false;
      },
    });
  }

  resendCode() {
    const identity = this.form.value.identity;
    if (!identity || !this.canResend) return;
    this.canResend = false;
    this.resendIn = 30;
    this.auth.requestPasswordRecovery(identity!).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Código reenviado', detail: 'Revisá tu correo.' });
        this.startCooldown();
      },
      error: () => {
        this.message.add({ severity: 'warn', summary: 'Atención', detail: 'No pudimos reenviar el código aún.' });
        // aun así reactivar cooldown para evitar spam
        this.startCooldown();
      }
    });
  }

  private startCooldown() {
    this.canResend = false;
    this.resendIn = 30;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.resendIn -= 1;
      if (this.resendIn <= 0) {
        this.canResend = true;
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1000);
  }

  // --- UI helpers ---
  maskedIdentity: string | null = null;
  private updateMaskedIdentity() {
    const id = this.form.value.identity ?? '';
    this.maskedIdentity = this.maskIdentity(String(id));
  }

  private maskIdentity(identity: string): string {
    // Si parece un email, ocultar parte local
    if (identity.includes('@')) {
      const [local, domain] = identity.split('@');
      if (!domain) return identity;
      const keep = Math.min(2, local.length);
      const maskedLen = Math.max(1, local.length - keep);
      return `${local.slice(0, keep)}${'*'.repeat(maskedLen)}@${domain}`;
    }
    // Para otras identidades (CUIL/nombre) lo dejamos igual
    return identity;
  }
}
