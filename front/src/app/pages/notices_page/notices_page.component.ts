import { Component, inject, computed, NgZone, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import {
  NoticesService,
  Notice,
  NoticeCommissionTarget,
} from '../../core/services/notices.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ROLE, VisibleRole } from '../../core/auth/roles';
import { CanAnyRoleDirective } from '../../shared/directives/can-any-role.directive';
import { BlockedActionDirective } from '../../shared/directives/blocked-action.directive';

@Component({
  selector: 'app-notices-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditorModule,
    ButtonModule,
    CanAnyRoleDirective,
    BlockedActionDirective,
  ],
  templateUrl: './notices_page.component.html',
  styleUrls: ['./notices_page.component.scss'],
})
export class NoticesPageComponent implements OnInit {
  private noticesSrv = inject(NoticesService);
  private permissions = inject(PermissionService);
  private zone = inject(NgZone);
  protected readonly ROLE = ROLE;

  notices = this.noticesSrv.notices;
  segmentByCommission = this.noticesSrv.segmentByCommission;
  commissionOptions = this.noticesSrv.commissionOptions;

  canManage = computed(() =>
    this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.PRECEPTOR,
      ROLE.EXECUTIVE_SECRETARY,
    ]),
  );

  newNotice: Partial<Notice> &
    Pick<Notice, 'visibleFor'> & {
      commissionTargets?: NoticeCommissionTarget[];
    } = {
    title: '',
    content: '',
    visibleFor: ROLE.STUDENT as VisibleRole,
    commissionTargets: [],
  };
  selectedCommissionIds: number[] = [];

  constructor() {
    effect(() => {
      if (this.segmentByCommission()) {
        void this.noticesSrv.ensureCommissionOptionsLoaded();
      }
    });
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      });
    });
  }

  async addNotice() {
    try {
      await this.noticesSrv.create({
        title: this.newNotice.title?.trim(),
        content: this.newNotice.content!,
        visibleFor: (this.newNotice.visibleFor as VisibleRole | 'all') ?? 'all',
        commissionIds: this.segmentByCommission()
          ? this.selectedCommissionIds
          : undefined,
      });

      this.newNotice = {
        title: '',
        content: '',
        visibleFor: ROLE.STUDENT as VisibleRole,
        commissionTargets: [],
      };
      this.selectedCommissionIds = [];
    } catch (e: any) {
      alert(String(e?.message ?? 'No se pudo publicar el aviso.'));
    }
  }

  deleteNotice(id: number) {
    this.noticesSrv.remove(id);
  }
}
