import { Directive, inject, Input, Renderer2, ElementRef, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subscription, map } from 'rxjs';

/**
 * blockedAction: Añade estado disabled y tooltip si el usuario está bloqueado.
 * Uso: <button pButton blockedAction (click)=...>
 * Opcional: [blockedAction]="false" para forzar que NO aplique (por defecto true)
 * También respeta el atributo [disabled] existente: si ya está disabled no cambia su razón.
 */
@Directive({
  selector: '[blockedAction]',
  standalone: true,
})
export class BlockedActionDirective implements OnInit, OnDestroy, OnChanges {
  @Input('blockedAction') enabled: boolean = true;
  private auth = inject(AuthService);
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private sub?: Subscription;
  private lastBlocked = false;

  ngOnInit() {
    this.sub = this.auth.getUser().pipe(map(u => !!u?.isBlocked)).subscribe(isBlocked => {
      this.lastBlocked = isBlocked;
      this.updateVisuals();
    });
  }

  ngOnChanges(_: SimpleChanges): void {
    this.updateVisuals();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateVisuals() {
    if (!this.enabled) {
      this.clearBlockedVisuals();
      return;
    }
    if (this.lastBlocked) {
      this.applyBlocked();
    } else {
      this.clearBlockedVisuals();
    }
  }

  private applyBlocked() {
    const native = this.el.nativeElement;
    // Añadimos atributo disabled si es un elemento que lo soporta
    if (this.canDisable(native)) {
      this.renderer.setProperty(native, 'disabled', true);
    }
    // Añadimos data-atributo para estilo/tooltip
    this.renderer.setAttribute(native, 'data-blocked', 'true');
    // Si tiene pTooltip no lo sobrescribimos; si no, agregamos título simple
    if (!native.getAttribute('pTooltip') && !native.getAttribute('title')) {
      this.renderer.setAttribute(native, 'title', 'Acción deshabilitada: cuenta bloqueada');
    }
    this.renderer.addClass(native, 'blocked-action');
  }

  private clearBlockedVisuals() {
    const native = this.el.nativeElement;
    if (native.getAttribute('data-blocked')) {
      this.renderer.removeAttribute(native, 'data-blocked');
      if (native.getAttribute('title') === 'Acción deshabilitada: cuenta bloqueada') {
        this.renderer.removeAttribute(native, 'title');
      }
      this.renderer.removeClass(native, 'blocked-action');
      // No reactivamos "disabled" si otro binding lo puso; asumimos que solo lo pusimos nosotros
      // (Si estuviera deshabilitado por otra razón el dev la controla externamente)
    }
  }

  private canDisable(el: HTMLElement) {
    return ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
  }
}
