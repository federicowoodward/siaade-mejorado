import {
  Directive,
  EffectRef,
  Input,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { RbacService } from '@/core/rbac/rbac.service';
import { RoleLike } from '@/core/auth/roles';

type RoleInput = RoleLike[] | RoleLike;

@Directive({
  selector: '[appCanAnyRole],[canAnyRole]',
  standalone: true,
})
export class CanAnyRoleDirective implements OnDestroy {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly rbac = inject(RbacService);

  private requiredRoles: RoleLike[] = [];
  private loadingTemplate: TemplateRef<unknown> | null = null;
  private mainViewRef: unknown = null;
  private loadingViewRef: unknown = null;
  private readonly autorun: EffectRef;

  constructor() {
    this.autorun = effect(() => {
      // subscribe to role changes
      this.rbac.roles();
      this.render();
    });
  }

  @Input({ required: true })
  set appCanAnyRole(value: RoleInput) {
    this.requiredRoles = this.normalizeInput(value);
    this.render();
  }

  @Input()
  set canAnyRole(value: RoleInput) {
    this.appCanAnyRole = value;
  }

  @Input('appCanAnyRoleLoading')
  set appCanAnyRoleLoading(template: TemplateRef<unknown> | null) {
    this.loadingTemplate = template ?? null;
    this.render();
  }

  @Input('canAnyRoleLoading')
  set legacyLoading(template: TemplateRef<unknown> | null) {
    this.appCanAnyRoleLoading = template;
  }

  ngOnDestroy(): void {
    this.autorun.destroy();
  }

  private render(): void {
    const rolesState = this.rbac.roles();

    if (rolesState === null) {
      this.showLoadingState();
      return;
    }

    this.clearLoadingView();
    const allowed = this.rbac.hasAny(this.requiredRoles);
    if (allowed) {
      this.ensureMainView();
    } else {
      this.clearMainView();
    }
  }

  private showLoadingState(): void {
    if (this.loadingTemplate) {
      if (!this.loadingViewRef) {
        this.viewContainer.clear();
        this.loadingViewRef = this.viewContainer.createEmbeddedView(
          this.loadingTemplate,
        );
        this.mainViewRef = null;
      }
      return;
    }
    this.ensureMainView();
  }

  private ensureMainView(): void {
    if (this.mainViewRef) {
      return;
    }
    this.viewContainer.clear();
    this.mainViewRef = this.viewContainer.createEmbeddedView(this.template);
    this.loadingViewRef = null;
  }

  private clearMainView(): void {
    if (!this.mainViewRef) {
      return;
    }
    this.viewContainer.clear();
    this.mainViewRef = null;
  }

  private clearLoadingView(): void {
    if (!this.loadingViewRef) {
      return;
    }
    this.viewContainer.clear();
    this.loadingViewRef = null;
  }

  private normalizeInput(value: RoleInput): RoleLike[] {
    return Array.isArray(value) ? value : [value];
  }
}
