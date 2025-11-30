import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface GeoOption {
  label: string;
  value: string;
}

interface ProvinceResponse {
  provincias: { nombre: string }[];
}

interface DepartmentResponse {
  departamentos: { nombre: string }[];
}

interface LocalityResponse {
  localidades: { nombre: string }[];
}

@Injectable({ providedIn: 'root' })
export class ArgentinaGeoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://apis.datos.gob.ar/georef/api';

  private provincesCache$?: Observable<GeoOption[]>;
  private departmentsCache = new Map<string, Observable<GeoOption[]>>();
  private localitiesCache = new Map<string, Observable<GeoOption[]>>();

  getProvinces(): Observable<GeoOption[]> {
    if (!this.provincesCache$) {
      this.provincesCache$ = this.http
        .get<ProvinceResponse>(
          `${this.baseUrl}/provincias?orden=nombre&campos=nombre&max=100`,
        )
        .pipe(
          map((resp) =>
            (resp.provincias ?? []).map((prov) => ({
              label: prov.nombre,
              value: prov.nombre,
            })),
          ),
          shareReplay(1),
        );
    }
    return this.provincesCache$;
  }

  getDepartments(province: string): Observable<GeoOption[]> {
    if (!province) {
      return of([]);
    }
    const key = province.toLowerCase();
    if (!this.departmentsCache.has(key)) {
      const url = `${this.baseUrl}/departamentos?provincia=${encodeURIComponent(
        province,
      )}&campos=nombre&orden=nombre&max=500`;
      this.departmentsCache.set(
        key,
        this.http.get<DepartmentResponse>(url).pipe(
          map((resp) =>
            (resp.departamentos ?? []).map((dept) => ({
              label: dept.nombre,
              value: dept.nombre,
            })),
          ),
          shareReplay(1),
        ),
      );
    }
    return this.departmentsCache.get(key)!;
  }

  getLocalities(
    province: string,
    department?: string,
  ): Observable<GeoOption[]> {
    if (!province) {
      return of([]);
    }
    const cacheKey = `${province.toLowerCase()}|${department?.toLowerCase() ?? 'all'}`;
    if (!this.localitiesCache.has(cacheKey)) {
      const query = new URLSearchParams({
        provincia: province,
        campos: 'nombre',
        orden: 'nombre',
        max: '500',
      });
      if (department) {
        query.append('departamento', department);
      }
      const url = `${this.baseUrl}/localidades?${query.toString()}`;
      this.localitiesCache.set(
        cacheKey,
        this.http.get<LocalityResponse>(url).pipe(
          map((resp) =>
            (resp.localidades ?? []).map((loc) => ({
              label: loc.nombre,
              value: loc.nombre,
            })),
          ),
          shareReplay(1),
        ),
      );
    }
    return this.localitiesCache.get(cacheKey)!;
  }
}
