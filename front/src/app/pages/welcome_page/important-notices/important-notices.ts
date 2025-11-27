import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NoticesService, Notice } from '../../../core/services/notices.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { Button } from 'primeng/button';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-important-notices',
  standalone: true,
  imports: [CommonModule, CardModule, DividerModule, Button, RouterModule],
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
    if (!role) {
      return all.slice(0, 3);
    }

    let visible: Notice[];
    if (
      role === ROLE.PRECEPTOR ||
      role === ROLE.SECRETARY ||
      role === ROLE.EXECUTIVE_SECRETARY
    ) {
      visible = all;
    } else {
      visible = all.filter(
        (n) => n.visibleFor === 'all' || n.visibleFor === role,
      );
    }

    return visible.slice(0, 3);
  });
}
