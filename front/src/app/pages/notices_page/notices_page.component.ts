import { Component, inject, computed, NgZone, OnInit, effect, signal } from '@angular/core';
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
    CanAnyRoleDirective,
    BlockedActionDirective,
  ],
  templateUrl: './notices_page.component.html',
  styleUrls: ['./notices_page.component.scss'],
})
export class NoticesPageComponent implements OnInit {
  private noticesSrv = inject(NoticesService);
  private permissions = inject(PermissionService);
  private catalogs = inject(CatalogsService);
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
  availableYears = signal<number[]>([]);
  selectedYearNumbers: number[] = [];
  loadingYears = signal<boolean>(false);

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
      await this.loadAvailableYears();
    }
  }

  async onVisibleForChange() {
    if (this.newNotice.visibleFor === ROLE.STUDENT) {
      await this.loadAvailableYears();
    } else {
      this.availableYears.set([]);
      this.selectedYearNumbers = [];
    }
  }

  onYearSelectionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedValues: number[] = [];
    const available = this.availableYears();
    
    // Leer los valores seleccionados usando el índice para obtener el valor real del array
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].selected && i < available.length) {
        selectedValues.push(available[i]);
      }
    }
    this.selectedYearNumbers = selectedValues;
  }

  async loadAvailableYears() {
    this.loadingYears.set(true);
    try {
      const careerId = 1;
      const years = await firstValueFrom(this.catalogs.getCareerYears(careerId));
      this.availableYears.set(years);
    } catch (error) {
      console.error('Error al cargar años:', error);
      this.availableYears.set([]);
    } finally {
      this.loadingYears.set(false);
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
        yearNumbers: this.newNotice.visibleFor === ROLE.STUDENT && this.selectedYearNumbers.length > 0
          ? this.selectedYearNumbers
          : undefined,
      });

      this.newNotice = {
        title: '',
        content: '',
        visibleFor: ROLE.STUDENT as VisibleRole,
        commissionTargets: [],
      };
      this.selectedCommissionIds = [];
      this.selectedYearNumbers = [];
    } catch (e: any) {
      alert(String(e?.message ?? 'No se pudo publicar el aviso.'));
    }
  }

  deleteNotice(id: number) {
    this.noticesSrv.remove(id);
  }
}
