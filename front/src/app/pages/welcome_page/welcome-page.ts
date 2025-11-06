import { Component, inject, OnInit, signal, computed } from "@angular/core";
import { Observable, map } from 'rxjs';
import { AuthService } from "../../core/services/auth.service";
import { PermissionService } from "../../core/auth/permission.service";
import { ROLE } from "../../core/auth/roles";
import { QuickAccessComponent } from "../../shared/components/quick-access-component/quick-access-component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-welcome-page",
  standalone: true,
  imports: [CommonModule, QuickAccessComponent],
  templateUrl: "./welcome-page.html",
  styleUrls: ["./welcome-page.scss"],
})
export class WelcomePage implements OnInit {
  private authService = inject(AuthService);
  private permissions = inject(PermissionService);

  public role: ROLE | null;

  constructor() {
    this.role = this.permissions.role();
  }

  userName = signal<string>("");
  userRole = computed(() => this.permissions.role());

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name ?? ""} ${user.lastName ?? ""}`.trim());
      }
    });
  }

  // Observable del usuario para el banner de bloqueo
  blockedUser$: Observable<{ isBlocked: boolean; blockedReason: string | null } | null> = this.authService.getUser().pipe(
    map(u => u ? { isBlocked: !!u.isBlocked, blockedReason: u.blockedReason ?? null } : null)
  );
}
