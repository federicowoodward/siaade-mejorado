import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { AuthStateService } from './auth/auth-state.service';

/**
 * Refresca el token de forma preventiva cuando el usuario está activo
 * para evitar expulsiones por inactividad mientras hay interacción real.
 */
@Injectable({ providedIn: 'root' })
export class IdleKeepaliveService implements OnDestroy {
  private readonly authState = inject(AuthStateService);
  private lastActivity = Date.now();
  private checkSub: Subscription | null = null;
  private refreshInFlight = false;

  private readonly activityEvents = [
    'click',
    'keydown',
    'mousemove',
    'touchstart',
  ];

  constructor() {
    this.bindActivityListeners();
    this.start();
  }

  start(): void {
    this.stop();
    // chequeo cada 60s si hay actividad reciente y el token está próximo a expirar
    this.checkSub = timer(0, 60_000).subscribe(() => this.maybeRefresh());
  }

  stop(): void {
    if (this.checkSub) {
      this.checkSub.unsubscribe();
      this.checkSub = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
    this.unbindActivityListeners();
  }

  private bindActivityListeners(): void {
    this.activityEvents.forEach((evt) =>
      window.addEventListener(evt, this.markActivity, { passive: true }),
    );
  }

  private unbindActivityListeners(): void {
    this.activityEvents.forEach((evt) =>
      window.removeEventListener(evt, this.markActivity),
    );
  }

  private markActivity = (): void => {
    this.lastActivity = Date.now();
  };

  private maybeRefresh(): void {
    const token = this.authState.getAccessTokenSnapshot();
    if (!token) return;

    const exp = this.decodeJwtExp(token);
    if (!exp) return;

    const now = Date.now();
    const msToExp = exp * 1000 - now;
    const recentlyActive = now - this.lastActivity < 5 * 60_000; // 5 minutos

    // Solo refrescamos si el usuario estuvo activo recientemente y
    // el token vence en menos de 4 minutos.
    if (!recentlyActive || msToExp > 4 * 60_000) return;

    if (this.refreshInFlight) return;
    this.refreshInFlight = true;

    this.authState.refreshTokens().subscribe({
      error: () => {
        // se deja que el flujo de AuthState maneje el fallo
        this.refreshInFlight = false;
      },
      next: () => {
        this.refreshInFlight = false;
      },
    });
  }

  private decodeJwtExp(token: string): number | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
      );
      const exp = Number(payload?.exp);
      return Number.isFinite(exp) ? exp : null;
    } catch {
      return null;
    }
  }
}
