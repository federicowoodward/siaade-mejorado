import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

type WithId = { id?: string | number; userId?: string | number };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private db$: BehaviorSubject<any | null> = new BehaviorSubject<any | null>(
    null
  );

  constructor(private http: HttpClient) {
    this.loadDb();
  }

  private loadDb() {
    this.http.get<any>('./assets/mock-data.json').subscribe((db) => this.db$.next(db));
  }

  /**
   * Get all records from a "table".
   * Usage: api.getAll('users')
   */
  getAll<T = any>(table: string): Observable<T[]> {
    return this.db$.pipe(
      map((db) => (db ? db[table] ?? [] : [])),
      shareReplay(1)
    );
  }

  /**
   * Get record by id (assumes 'id' or 'userId' for students/teachers/etc).
   */
  getById<T extends WithId>(
    table: string,
    id: string | number
  ): Observable<T | undefined> {
    return this.getAll<T>(table).pipe(
      map((list) => list.find((item) => item.id === id || item.userId === id))
    );
  }

  /**
   * Get with custom filter.
   * Usage: api.getWhere('users', u => u.roleId === 1)
   */
  getWhere<T = any>(
    table: string,
    filter: (item: T) => boolean
  ): Observable<T[]> {
    return this.getAll<T>(table).pipe(map((list) => list.filter(filter)));
  }
}
