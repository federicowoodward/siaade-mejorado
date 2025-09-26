import { Injectable, signal } from '@angular/core';
import type { RoleName } from './role.service';

// Sólo alumnos y profes reciben avisos segmentados
type VisibleRole = Extract<RoleName, 'student' | 'teacher'>;

export interface Notice {
    id: number;
    title: string;
    content: string;                  // HTML (viene del p-editor)
    visibleFor: VisibleRole;          // 'student' | 'teacher'
    createdBy: string;                // nombre del preceptor
    createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  // seed opcional para ver algo en inicio
    private readonly _notices = signal<Notice[]>([
    {
    id: 1,
    title: 'Inscripciones abiertas',
    content: '<p>Desde el 1 al 30 de Noviembre</p>',
    visibleFor: 'student',
    createdBy: 'Preceptor Juan',
    createdAt: new Date()
    }
    ]);

  // Signal de solo lectura para consumir en componentes
    readonly notices = this._notices.asReadonly();

    add(notice: Notice) {
    this._notices.update(curr => [...curr, notice]);
}

    remove(id: number) {
    this._notices.update(curr => curr.filter(n => n.id !== id));
}
}