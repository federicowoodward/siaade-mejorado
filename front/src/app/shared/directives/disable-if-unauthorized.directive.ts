import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  effect,
  inject,
} from '@angular/core';
import { RoleService } from '@/core/auth/role.service';
import { RoleLike } from '@/core/auth/roles';

@Directive({
  selector: '[disableIfUnauthorized]',
  standalone: true,
})
export class DisableIfUnauthorizedDirective {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly roles = inject(RoleService);

  private requiredRoles: RoleLike[] = [];
  private applied = false;
  private previousTitle: string | null = null;

  constructor() {
    effect(() => this.apply());
  }

  @Input({ required: true })
  set disableIfUnauthorized(value: RoleLike[] | RoleLike) {
    this.requiredRoles = Array.isArray(value) ? value : [value];
    this.apply();
  }

  private apply(): void {
    const allowed = this.roles.hasAny(this.requiredRoles);
    if (!allowed) {
      this.applyDisabledState();
      return;
    }

    if (this.applied) {
      this.renderer.setProperty(this.element.nativeElement, 'disabled', false);
      if (this.previousTitle === null) {
        if (this.element.nativeElement.getAttribute('title') === 'Sin permisos') {
          this.renderer.removeAttribute(this.element.nativeElement, 'title');
        }
      } else {
        this.renderer.setAttribute(this.element.nativeElement, 'title', this.previousTitle);
      }
      this.applied = false;
    }
  }

  private applyDisabledState(): void {
    if (!this.applied) {
      this.previousTitle = this.element.nativeElement.getAttribute('title');
      this.applied = true;
    }
    this.renderer.setProperty(this.element.nativeElement, 'disabled', true);
    this.renderer.setAttribute(this.element.nativeElement, 'title', 'Sin permisos');
  }
}
