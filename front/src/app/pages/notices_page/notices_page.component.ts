import { Component, inject, computed, AfterViewInit, NgZone } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EditorModule } from "primeng/editor";
import { ButtonModule } from "primeng/button";
import { NoticesService, Notice } from "../../core/services/notices.service";
import { PermissionService } from "../../core/auth/permission.service";
import { ROLE, VisibleRole } from "../../core/auth/roles";
import { CanAnyRoleDirective } from "../../shared/directives/can-any-role.directive";

@Component({
  selector: "app-notices-page",
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule, ButtonModule, CanAnyRoleDirective],
  templateUrl: "./notices_page.component.html",
  styleUrls: ["./notices_page.component.scss"],
})
export class NoticesPageComponent implements AfterViewInit {
  private noticesSrv = inject(NoticesService);
  private permissions = inject(PermissionService);
  private zone = inject(NgZone);
  protected readonly ROLE = ROLE;

  notices = this.noticesSrv.notices;

  canManage = computed(() =>
    this.permissions.hasAnyRole([ROLE.SECRETARY, ROLE.PRECEPTOR, ROLE.EXECUTIVE_SECRETARY])
  );

  newNotice: Partial<Notice> = {
    title: "",
    content: "",
    visibleFor: ROLE.STUDENT as VisibleRole,
  };

  ngAfterViewInit(): void {
    // Fuerza un re-layout inicial para que Quill (p-editor) calcule correctamente
    // alturas/anchos cuando el contenedor se monta dentro de layouts flex/overflow.
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
        // Segundo tick por si el toolbar carga asíncronamente
        setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
      });
    });
  }

  addNotice() {
    if (!this.newNotice.title?.trim() || !this.newNotice.content?.trim()) return;

    this.noticesSrv.create({
      title: this.newNotice.title!.trim(),
      content: this.newNotice.content!,
      visibleFor: (this.newNotice.visibleFor as VisibleRole | "all") ?? "all",
    });

    this.newNotice = {
      title: "",
      content: "",
      visibleFor: ROLE.STUDENT as VisibleRole,
    };
  }

  deleteNotice(id: number) {
    this.noticesSrv.remove(id);
  }
}
