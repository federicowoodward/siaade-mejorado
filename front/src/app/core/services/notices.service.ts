import { Injectable, effect, signal } from '@angular/core';
import { ApiService } from './api.service';
import { RolesService } from './role.service';
import type { RoleName } from './role.service';

// Sólo alumnos y profes reciben avisos segmentados en el front
type VisibleRole = Extract<RoleName, 'student' | 'teacher'>;

export interface Notice {
  id: number;
  title: string;
  content: string;              // HTML (viene del p-editor)
  visibleFor: VisibleRole;      // 'student' | 'teacher'
  createdBy: string;            // texto presentable
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  constructor(private api: ApiService, private roles: RolesService) {
    effect(() => {
      const role = this.roles.currentRole();
      this.loadForRole(role);
    });
  }

  private readonly _notices = signal<Notice[]>([]);
  readonly notices = this._notices.asReadonly();

  async loadForRole(role: RoleName) {
    try {
      if (role === 'student' || role === 'teacher') {
        const audience = role;
        const data = await this.api
          .request<any[]>('GET', 'notices', undefined, { audience })
          .toPromise();
        this._notices.set(this.mapFromApiList(data ?? [], role));
      } else {
        const [a, b] = await Promise.all([
          this.api.request<any[]>('GET', 'notices', undefined, { audience: 'student' }).toPromise(),
          this.api.request<any[]>('GET', 'notices', undefined, { audience: 'teacher' }).toPromise(),
        ]);
        const merged = this.mergeById([...(a ?? []), ...(b ?? [])]);
        this._notices.set(this.mapFromApiList(merged, 'student'));
      }
    } catch (e) {
      console.error('[Notices] loadForRole error:', e);
      this._notices.set([]);
    }
  }

  // Crear aviso: visibleFor -> visibleRoleId (2=teacher, 4=student), omite para "todos"
  async create(input: { title: string; content: string; visibleFor?: VisibleRole | 'all' }) {
    const body: any = {
      title: input.title,
      content: input.content,
    };
    if (input.visibleFor) body.visibleFor = input.visibleFor;

    const created = await this.api.request<any>('POST', 'notices', body).toPromise();
    const role = this.roles.currentRole();
    await this.loadForRole(role);
    return this.mapFromApi(created, role === 'teacher' ? 'teacher' : 'student');
  }

  async remove(id: number) {
    await this.api.request('DELETE', `notices/${id}`).toPromise();
    this._notices.update((curr) => curr.filter((n) => n.id !== id));
  }

  // Helpers ----------------------------------------------------
  private mergeById(list: any[]): any[] {
    const map = new Map<number, any>();
    for (const it of list) {
      if (!map.has(it.id)) map.set(it.id, it);
    }
    return Array.from(map.values());
  }

  private mapFromApiList(rows: any[], fallbackRole: VisibleRole): Notice[] {
    return rows.map((r) => this.mapFromApi(r, fallbackRole));
  }

  private mapFromApi(r: any, fallbackRole: VisibleRole): Notice {
    let visibleFor: VisibleRole = fallbackRole;
    if (typeof r.visibleFor === 'string') {
      const val = String(r.visibleFor).toLowerCase();
      if (val === 'teacher') visibleFor = 'teacher';
      else if (val === 'student') visibleFor = 'student';
    } else if (typeof r.visibleRoleId === 'number') {
      visibleFor = r.visibleRoleId === 2 ? 'teacher' : 'student';
    }
    return {
      id: Number(r.id),
      title: String(r.title ?? ''),
      content: String(r.content ?? ''),
      visibleFor,
      createdBy: String(r.createdBy ?? 'Secretaría'),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    };
  }
}