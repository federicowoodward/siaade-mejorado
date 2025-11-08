import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { RoleService } from '@/core/auth/role.service';
import { RoleLike } from '@/core/auth/roles';

@Directive({
  selector: '[canAllRoles]',
  standalone: true,
})
export class CanAllRolesDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly rolesService = inject(RoleService);

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
    const allowed = this.rolesService.hasAll(this.requiredRoles);
    if (allowed && !this.viewAttached) {
      this.viewContainer.createEmbeddedView(this.template);
      this.viewAttached = true;
    } else if (!allowed && this.viewAttached) {
      this.viewContainer.clear();
      this.viewAttached = false;
    }
  }
}
