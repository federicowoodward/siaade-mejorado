import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  templateUrl: './auth-page.html',
  styleUrls: ['./auth-page.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
})
export class AuthPage {
  // Estado: true = login, false = recover
  loginMode = signal(true);
  modeTitle = computed(() =>
    this.loginMode() ? 'Iniciar sesión' : 'Recuperar contraseña',
  );
  // (Simplificado) Solo modo; se eliminan señales de barrido para transición fluida
  transitioning = signal(false);
  expandPhase = signal(false); // true mientras se expande a full ancho
  private fb = inject(FormBuilder);
  // Señales de envío (para deshabilitar botones y futura UI de spinner)
  submittingLogin = signal(false);
  submittingRecover = signal(false);

  loginForm = this.fb.group({
    identity: ['', Validators.required],
    password: ['', Validators.required],
  });

  recoverForm = this.fb.group({
    identity: ['', Validators.required], // email / CUIL / usuario
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private message: MessageService,
  ) {}

  changeMode() {
    if (this.transitioning()) return;
    // En móvil (layout compacto) hacemos toggle instantáneo sin animación wipe
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches
    ) {
      this.loginMode.update((v) => !v);
      return;
    }
    const expandMs = 700; // desktop wipe
    const shrinkMs = 420; // contracción
    this.transitioning.set(true);
    this.expandPhase.set(true);
    // Al finalizar expansión, cambiar modo y comenzar contracción
    setTimeout(() => {
      this.loginMode.update((v) => !v);
      this.expandPhase.set(false);
    }, expandMs);
    // Al finalizar contracción, limpiar flags
    setTimeout(() => {
      this.transitioning.set(false);
    }, expandMs + shrinkMs);
  }

  goToResetCode() {
    this.router.navigate(['/auth/reset-code']);
  }

  setMode(mode: 'login' | 'recover') {
    if ((mode === 'login') === this.loginMode()) return;
    // reutiliza changeMode (auto-decide animación) pero evita doble lógica
    this.changeMode();
  }

  async submitLogin() {
    if (this.loginForm.invalid || this.submittingLogin()) return;
    const { identity, password } = this.loginForm.value;
    this.submittingLogin.set(true);

    try {
      const result = await this.auth.loginWithReason({
        identity: identity!,
        password: password!,
      });
      if (result.ok) {
        this.router.navigate(['/welcome']);
      } else if (result.blocked) {
        const detail = result.blockedReason
          ? `Tu cuenta está bloqueada. Motivo: ${result.blockedReason}`
          : 'Tu cuenta está bloqueada.';
        this.message.add({
          severity: 'warn',
          summary: 'Acceso bloqueado',
          detail,
        });
      } else if (result.inactive) {
        this.message.add({
          severity: 'warn',
          summary: 'Cuenta inactiva',
          detail: 'Esta cuenta fue desactivada/eliminada.',
        });
      } else {
        this.message.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Usuario o contraseña incorrectos',
        });
      }
    } catch (error: any) {
      const status = error?.status;
      const reason = error?.error?.reason ?? null;
      if (status === 403 && reason) {
        this.message.add({
          severity: 'warn',
          summary: 'Acceso bloqueado',
          detail: `Tu cuenta está bloqueada. Motivo: ${reason}`,
        });
      } else if (status === 403) {
        this.message.add({
          severity: 'warn',
          summary: 'Acceso bloqueado',
          detail: 'Tu cuenta está bloqueada.',
        });
      } else if (status === 401) {
        this.message.add({
          severity: 'warn',
          summary: 'Cuenta inactiva',
          detail: 'Esta cuenta está inactiva o eliminada.',
        });
      } else {
        this.message.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo iniciar sesión',
        });
      }
    } finally {
      this.submittingLogin.set(false);
    }
  }

  submitRecover() {
    if (this.recoverForm.invalid || this.submittingRecover()) return;
    const { identity } = this.recoverForm.value;
    this.submittingRecover.set(true);
    this.auth.requestPasswordRecovery(identity!).subscribe({
      next: (resp: any) => {
        const msg =
          'Te enviamos un código a tu correo. Ingresalo para continuar';
        this.message.add({
          severity: 'success',
          summary: 'Código enviado',
          detail: msg,
        });
        // Persistimos la identidad para no volver a pedirla en la pantalla de código
        try {
          sessionStorage.setItem('resetIdentity', identity!);
        } catch {
          // ignore storage errors
        }
        // Navegar a la pantalla de código llevando la identidad en el state
        this.router.navigate(['/auth/reset-code'], { state: { identity } });
      },
      error: () => {
        this.message.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'No se pudo procesar la solicitud.',
        });
      },
      complete: () => this.submittingRecover.set(false),
    });
  }
}
