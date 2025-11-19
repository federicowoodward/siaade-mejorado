import {
  Directive,
  EffectRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  effect,
} from '@angular/core';
import { PermissionService } from '../../core/auth/permission.service';
import { ROLE, normalizeRole } from '../../core/auth/roles';

@Directive({
  selector: '[canRole]',
  standalone: true,
})
export class CanRoleDirective implements OnInit, OnDestroy {
  private readonly tpl: TemplateRef<unknown>;
  private readonly vcr: ViewContainerRef;
  private readonly permissions: PermissionService;

  private role: ROLE | null = null;
  private eff?: EffectRef;

  constructor(
    tpl: TemplateRef<unknown>,
    vcr: ViewContainerRef,
    permissions: PermissionService,
  ) {
    this.tpl = tpl;
    this.vcr = vcr;
    this.permissions = permissions;
  }

  @Input() set canRole(value: ROLE | string | null | undefined) {
    this.role = normalizeRole(value);
    this.render(this.permissions.currentRole());
  }

  ngOnInit(): void {
    this.eff = effect(() => {
      const current = this.permissions.currentRole();
      this.render(current);
    });
  }

  ngOnDestroy(): void {
    this.eff?.destroy();
  }

  private render(current: ROLE | null) {
    this.vcr.clear();
    if (this.role && current === this.role) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
