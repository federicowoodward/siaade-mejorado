import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { RbacService } from '@/core/rbac/rbac.service';
import { RoleLike } from '@/core/auth/roles';

@Directive({
  selector: '[canAllRoles]',
  standalone: true,
})
export class CanAllRolesDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly rbac = inject(RbacService);

  private requiredRoles: RoleLike[] = [];
  private viewAttached = false;

  constructor() {
    effect(() => this.render());
  }

  @Input({ required: true })
  set canAllRoles(value: RoleLike[] | RoleLike) {
    this.requiredRoles = Array.isArray(value) ? value : [value];
    this.render();
  }

  private render() {
    const rolesState = this.rbac.roles();
    if (rolesState === null) {
      if (!this.viewAttached) {
        this.viewContainer.createEmbeddedView(this.template);
        this.viewAttached = true;
      }
      return;
    }

    const allowed = this.rbac.hasAll(this.requiredRoles);
    if (allowed && !this.viewAttached) {
      this.viewContainer.createEmbeddedView(this.template);
      this.viewAttached = true;
    } else if (!allowed && this.viewAttached) {
      this.viewContainer.clear();
      this.viewAttached = false;
    }
  }
}
