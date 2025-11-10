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

  // Modo del flujo: 'recovery' (sin contraseña actual) o 'change' (dentro de sesión)
  private mode: 'recovery' | 'change' = 'recovery';

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
    const navState = (nav?.extras?.state as any) ?? (history?.state as any) ?? {};
    const identityFromNav = navState?.identity;
    const modeFromNav = (navState?.mode === 'change') ? 'change' : 'recovery';
    const identityFromStorage = (() => {
      try { return sessionStorage.getItem('resetIdentity'); } catch { return null; }
    })();
    const identity = identityFromNav || identityFromStorage || '';
    if (identity) {
      this.form.patchValue({ identity });
    }
    // Persistir identidad y modo para continuidad
    this.updateMaskedIdentity();
  try { sessionStorage.setItem('resetMode', modeFromNav); } catch {}
  this.mode = modeFromNav;
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
        // No mostrar toast en modo cambio voluntario para hacer la transición más directa
        const modeParam = (() => { try { return sessionStorage.getItem('resetMode'); } catch { return null; } })();
        if (modeParam !== 'change') {
          this.message.add({ severity: 'success', summary: 'Código verificado', detail: 'Continuá para crear tu nueva contraseña.' });
        }
        let modeParamResolved = 'recovery';
        try {
          modeParamResolved = sessionStorage.getItem('resetMode') === 'change' ? 'change' : 'recovery';
        } catch {}
        // Si es cambio voluntario (mode=change), redirigir a /account/password/reset
        // Si es recovery, redirigir a /auth/reset-password
        const targetPath = modeParamResolved === 'change' ? '/account/password/reset' : '/auth/reset-password';
        this.router.navigate([targetPath], { queryParams: { token, mode: modeParamResolved } });
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
    // En modo 'change' usamos el endpoint autenticado del backend; en 'recovery', el clásico por identidad
    if (this.mode === 'change') {
      this.auth.requestPasswordChangeCode().subscribe({
        next: () => {
          this.message.add({ severity: 'success', summary: 'Código reenviado', detail: 'Revisá tu correo.' });
          this.startCooldown();
        },
        error: () => {
          this.message.add({ severity: 'warn', summary: 'Atención', detail: 'No pudimos reenviar el código aún.' });
          this.startCooldown();
        }
      });
    } else {
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
    const str = identity ?? '';
    // Regla general: mostrar primeros 2 y último 1, enmascarar el medio
    const maskKeep2First1Last = (s: string): string => {
      if (s.length <= 2) return s; // nada por enmascarar
      if (s.length === 3) return s.slice(0, 2) + s.slice(-1); // sin asteriscos intermedios
      return s.slice(0, 2) + '*'.repeat(s.length - 3) + s.slice(-1);
    };

    // Emails: aplicar a la parte local antes del @
    if (str.includes('@')) {
      const [local, domain] = str.split('@');
      if (!domain) return maskKeep2First1Last(local);
      return `${maskKeep2First1Last(local)}@${domain}`;
    }

    // No-email (CUIL, nombre, etc.)
    return maskKeep2First1Last(str);
  }
}
