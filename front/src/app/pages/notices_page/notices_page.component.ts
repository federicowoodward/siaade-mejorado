import {
  Component,
  inject,
  computed,
  NgZone,
  OnInit,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import {
  NoticesService,
  Notice,
  NoticeCommissionTarget,
} from '../../core/services/notices.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ROLE, VisibleRole } from '../../core/auth/roles';
import { CanAnyRoleDirective } from '../../shared/directives/can-any-role.directive';
import { BlockedActionDirective } from '../../shared/directives/blocked-action.directive';
import { CatalogsService } from '../../core/services/catalogs.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-notices-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditorModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmPopupModule,
    CanAnyRoleDirective,
    BlockedActionDirective,
  ],
  templateUrl: './notices_page.component.html',
  styleUrls: ['./notices_page.component.scss'],
  providers: [ConfirmationService],
})
export class NoticesPageComponent implements OnInit {
  private noticesSrv = inject(NoticesService);
  private permissions = inject(PermissionService);
  private catalogs = inject(CatalogsService);
  private zone = inject(NgZone);
  private confirmationService = inject(ConfirmationService);
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

  async ngOnInit(): Promise<void> {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      });
    });
    if (this.newNotice.visibleFor === ROLE.STUDENT) {
    }
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

  confirm(event: Event, callback: () => void, onReject?: () => void) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de continuar?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => callback(),
      reject: () => {
        if (onReject) {
          onReject();
        }
      },
    });
  }
}
