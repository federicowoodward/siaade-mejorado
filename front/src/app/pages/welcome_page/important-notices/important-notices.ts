import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NoticesService, Notice } from '../../../core/services/notices.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
@Component({
  selector: 'app-important-notices',
  standalone: true,
  imports: [CommonModule, CardModule, DividerModule],
  templateUrl: './important-notices.html',
  styleUrl: './important-notices.scss',
})
export class ImportantNoticesComponent {
  private readonly noticesSrv = inject(NoticesService);
  private readonly permissions = inject(PermissionService);

  readonly role = this.permissions.role;
  readonly allNotices = this.noticesSrv.notices;

  readonly noticesForHome = computed<Notice[]>(() => {
    const role = this.role();
    const all = this.allNotices();
    if (!role) return all;
    if (
      role === ROLE.PRECEPTOR ||
      role === ROLE.SECRETARY ||
      role === ROLE.EXECUTIVE_SECRETARY
    ) {
      return all;
    }
    return all.filter((n) => n.visibleFor === 'all' || n.visibleFor === role);
  });
}
