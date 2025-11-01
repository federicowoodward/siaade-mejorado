import {
  Directive,
  EffectRef,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { PermissionService } from "../../core/auth/permission.service";
import { ROLE } from "../../core/auth/roles";

@Directive({
  selector: "[canAnyRole]",
  standalone: true,
})
export class CanAnyRoleDirective implements OnInit, OnDestroy {
  private readonly vcr = inject(ViewContainerRef);
  private readonly tpl = inject(TemplateRef<any>);
  private readonly perms = inject(PermissionService);

  private roles: ROLE[] = [];
  private eff?: EffectRef;

  @Input() set canAnyRole(value: ROLE[] | ROLE) {
    this.roles = Array.isArray(value) ? value : [value];
    this.render();
  }

  ngOnInit(): void {
    this.eff = effect(() => {
      this.render();
    });
  }

  ngOnDestroy(): void {
    this.eff?.destroy();
  }

  private render(): void {
    this.vcr.clear();
    if (this.perms.hasAnyRole(this.roles)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
