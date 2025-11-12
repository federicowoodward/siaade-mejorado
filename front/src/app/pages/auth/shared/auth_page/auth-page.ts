import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
      const result = await firstValueFrom(
        this.auth.loginWithReason({
          identity: identity!,
          password: password!,
        }),
      );

      if (result.ok) {
        await this.router.navigate(['/welcome']);
        return;
      }

      switch (result.kind) {
        case 'user_blocked':
          this.message.add({
            severity: 'warn',
            summary: 'Usuario bloqueado',
            detail: result.reason
              ? `Tu cuenta está bloqueada. Motivo: ${result.reason}`
              : 'Tu cuenta está bloqueada.',
          });
          break;
        case 'user_not_found':
          this.message.add({
            severity: 'warn',
            summary: 'Usuario no existe',
            detail: 'Verificá los datos ingresados.',
          });
          break;
        case 'invalid_credentials':
          this.message.add({
            severity: 'error',
            summary: 'Credenciales incorrectas',
            detail: 'Usuario o contraseña incorrectos',
          });
          break;
        case 'server':
          this.message.add({
            severity: 'error',
            summary: 'Error de servidor',
            detail: 'Ocurrió un problema procesando la solicitud.',
          });
          break;
        case 'network':
          this.message.add({
            severity: 'error',
            summary: 'Sin conexión',
            detail: 'No se pudo conectar al servidor.',
          });
          break;
        default:
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'No se pudo iniciar sesión',
          });
      }
    } finally {
      this.submittingLogin.set(false);
    }
  }

  async submitRecover() {
    if (this.recoverForm.invalid || this.submittingRecover()) return;
    const { identity } = this.recoverForm.value;
    this.submittingRecover.set(true);

    try {
      const result = await firstValueFrom(
        this.auth.requestPasswordRecovery(identity!),
      );

      if (result.ok) {
        this.message.add({
          severity: 'success',
          summary: 'Código enviado',
          detail:
            result.message ??
            'Te enviamos un código a tu correo. Ingresalo para continuar',
        });

        try {
          sessionStorage.setItem('resetIdentity', identity!);
        } catch {
          /* ignore storage failures */
        }

        await this.router.navigate(['/auth/reset-code'], {
          state: { identity },
        });
        return;
      }

      const summary =
        result.kind === 'network'
          ? 'Sin conexión'
          : result.kind === 'server'
            ? 'Error de servidor'
            : 'Atención';

      this.message.add({
        severity: result.kind === 'network' ? 'error' : 'warn',
        summary,
        detail: result.message || 'No se pudo procesar la solicitud.',
      });
    } finally {
      this.submittingRecover.set(false);
    }
  }
}
