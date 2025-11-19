import { Injectable, effect, signal } from '@angular/core';
import { ApiService } from './api.service';
import { PermissionService } from '../auth/permission.service';
import { ROLE, ROLE_IDS, VisibleRole } from '../auth/roles';

export interface Notice {
  id: number;
  title: string;
  content: string;
  visibleFor: VisibleRole | 'all';
  createdBy: string;
  createdAt: Date;
  commissionTargets: NoticeCommissionTarget[];
  hasCommissionFilter: boolean;
}

export interface NoticeCommissionTarget {
  id: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  constructor(
    private api: ApiService,
    private permissions: PermissionService,
  ) {
    effect(() => {
      const role = this.permissions.currentRole();
      this.loadForRole(role);
    });
  }

  private readonly _notices = signal<Notice[]>([]);
  readonly notices = this._notices.asReadonly();
  private readonly _segmentByCommission = signal(false);
  readonly segmentByCommission = this._segmentByCommission.asReadonly();
  private readonly _commissionOptions = signal<NoticeCommissionTarget[]>([]);
  readonly commissionOptions = this._commissionOptions.asReadonly();
  private commissionOptionsLoaded = false;

  async loadForRole(role: ROLE | null) {
    try {
      const params: Record<string, string> = {};
      if (role === ROLE.STUDENT) params['audience'] = 'student';
      else if (role === ROLE.TEACHER) params['audience'] = 'teacher';
      else params['audience'] = 'all';
      const payload = await this.api
        .request<{ data?: any[]; meta?: any }>('GET', 'notices', undefined, params)
        .toPromise();
      const rows = Array.isArray(payload?.data)
        ? payload?.data
        : Array.isArray(payload)
          ? (payload as any)
          : [];
      this._segmentByCommission.set(
        Boolean(payload?.meta?.segment_by_commission),
      );
      this._notices.set(
        this.mapFromApiList(
          rows ?? [],
          (role ?? ROLE.STUDENT) as VisibleRole | 'all',
        ),
      );
      if (this._segmentByCommission() && !this.commissionOptionsLoaded) {
        void this.ensureCommissionOptionsLoaded();
      }
    } catch (e) {
      console.error('[Notices] loadForRole error:', e);
      this._notices.set([]);
    }
  }

  async create(input: {
    title?: string;
    content: string;
    visibleFor?: VisibleRole | 'all';
    commissionIds?: number[];
    yearNumbers?: number[];
  }) {
    // Validación: el editor puede enviar <p><br></p> u HTML vacío; normalizamos
    const isEmptyHtml = (html: string | undefined | null) => {
      if (!html) return true;
      const text = String(html)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;|\s|\n|\r/g, '')
        .trim();
      return text.length === 0;
    };

    if (isEmptyHtml(input.content)) {
      throw new Error('El contenido no puede estar vacío.');
    }

    const body: any = {
      title: input.title?.trim() || '',
      content: input.content,
    };
    if (input.visibleFor) body.visibleFor = input.visibleFor;
    if (this._segmentByCommission() && input.commissionIds?.length) {
      body.commissionIds = Array.from(
        new Set(input.commissionIds.map((id) => Number(id))),
      ).filter((id) => Number.isFinite(id));
    }
    if (input.yearNumbers?.length) {
      body.yearNumbers = Array.from(
        new Set(input.yearNumbers.map((year) => Number(year))),
      ).filter((year) => Number.isFinite(year) && year > 0);
    }

    try {
      const created = await this.api
        .request<any>('POST', 'notices', body)
        .toPromise();
      const role = this.permissions.currentRole();
      await this.loadForRole(role);
      const fallback: VisibleRole =
        role === ROLE.TEACHER ? ROLE.TEACHER : ROLE.STUDENT;
      return this.mapFromApi(created, fallback, input.title);
    } catch (err: any) {
      const msg =
        err?.error?.message || err?.message || 'No se pudo crear el aviso.';
      throw new Error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  async remove(id: number) {
    await this.api.request('DELETE', `notices/${id}`).toPromise();
    this._notices.update((curr) => curr.filter((n) => n.id !== id));
  }

  private mapFromApiList(
    rows: any[],
    fallbackRole: VisibleRole | 'all',
  ): Notice[] {
    return rows.map((r) => this.mapFromApi(r, fallbackRole));
  }

  private mapFromApi(
    r: any,
    fallbackRole: VisibleRole | 'all',
    clientTitle?: string,
  ): Notice {
    let visibleFor: VisibleRole | 'all' = fallbackRole ?? ROLE.STUDENT;
    if (typeof r.visibleFor === 'string') {
      const val = String(r.visibleFor).toLowerCase();
      if (val === ROLE.TEACHER) visibleFor = ROLE.TEACHER;
      else if (val === ROLE.STUDENT) visibleFor = ROLE.STUDENT;
      else visibleFor = 'all';
    } else if (typeof r.visibleRoleId === 'number') {
      visibleFor =
        r.visibleRoleId === ROLE_IDS[ROLE.TEACHER]
          ? ROLE.TEACHER
          : r.visibleRoleId === ROLE_IDS[ROLE.STUDENT]
            ? ROLE.STUDENT
            : 'all';
    }
    const fallbackTitleFromContent = (() => {
      const text = String(r.content ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text.substring(0, 60) || 'Aviso';
    })();
    return {
      id: Number(r.id),
      title: (clientTitle ?? String(r.title ?? '')) || fallbackTitleFromContent,
      content: String(r.content ?? ''),
      visibleFor,
      createdBy: String(r.createdBy ?? 'Secretaria'),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      commissionTargets: Array.isArray(r.commissionTargets)
        ? r.commissionTargets.map((target: any) => ({
            id: Number(target.id),
            label: String(target.label ?? `Comision ${target.id ?? ''}`).trim(),
          }))
        : [],
      hasCommissionFilter: Boolean(
        r.hasCommissionFilter ??
          (Array.isArray(r.commissionTargets) && r.commissionTargets.length > 0),
      ),
    };
  }

  async ensureCommissionOptionsLoaded() {
    if (this.commissionOptionsLoaded) return;
    try {
      const rows = await this.api
        .request<any[]>('GET', 'catalogs/subject-commissions')
        .toPromise();
      const mapped = (rows ?? []).map((row) => ({
        id: Number(row.id),
        label: String(row.label ?? `Comision ${row.id}`),
      }));
      this._commissionOptions.set(mapped);
      this.commissionOptionsLoaded = true;
    } catch (error) {
      console.warn('[Notices] commission options failed', error);
    }
  }
}
