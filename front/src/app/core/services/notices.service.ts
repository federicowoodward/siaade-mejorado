// core/services/notices.service.ts
import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  title: string;
  content: string; // HTML desde el Editor
  visibleFor: 'student' | 'teacher' | 'all';
  createdBy: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  // Signal con la lista de avisos
  public notices = signal<Notice[]>([]);

  add(n: Notice) {
    this.notices.update(list => [n, ...list]);
  }

  remove(id: number) {
    this.notices.update(list => list.filter(x => x.id !== id));
  }
}
