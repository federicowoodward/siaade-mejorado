import { Component, inject, OnInit, signal, computed } from "@angular/core";
import { Observable, map } from 'rxjs';
import { AuthService } from "../../core/services/auth.service";
import { PermissionService } from "../../core/auth/permission.service";
import { ROLE } from "../../core/auth/roles";
import { QuickAccessComponent } from "../../shared/components/quick-access-component/quick-access-component";
import { CommonModule } from "@angular/common";
import { FirstPasswordChangeModalComponent } from "../../shared/components/first-password-change-modal/first-password-change-modal";

@Component({
  selector: "app-welcome-page",
  standalone: true,
  imports: [CommonModule, QuickAccessComponent, FirstPasswordChangeModalComponent],
  templateUrl: "./welcome-page.html",
  styleUrls: ["./welcome-page.scss"],
})
export class WelcomePage implements OnInit {
  authService = inject(AuthService); // public para template
  private permissions = inject(PermissionService);

  public role: ROLE | null;

  constructor() {
    this.role = this.permissions.role();
  }

  userName = signal<string>("");
  userRole = computed(() => this.permissions.role());
    showPasswordChangeModal = signal(false);

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name ?? ""} ${user.lastName ?? ""}`.trim());
          // Verificar si necesita cambiar la contraseña
          if (user.requiresPasswordChange) {
            this.showPasswordChangeModal.set(true);
          }
      }
    });
  }

  // Observable del usuario para el banner de bloqueo
  blockedUser$: Observable<{ isBlocked: boolean; blockedReason: string | null } | null> = this.authService.getUser().pipe(
    map(u => u ? { isBlocked: !!u.isBlocked, blockedReason: u.blockedReason ?? null } : null)
  );
}
