/*
Este buscador por ahora no lo usamos pero en un futuro puede servirnos, puede buscar alumnos y materias utilizando fuse.js

ejemplo:
  <app-generic-autocomplete
    [itemsList]="usersForSearch"
    [searchKeys]="['fullName','email','cuil']"
    displayField="fullName"
    placeholder="Buscar usuario..."
    [(ngModel)]="searchValue">
  </app-generic-autocomplete> 

*/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  AutoCompleteModule,
  AutoCompleteCompleteEvent,
} from 'primeng/autocomplete';
import Fuse from 'fuse.js';

@Component({
  selector: 'app-generic-autocomplete',
  standalone: true,
  imports: [AutoCompleteModule, FormsModule, CommonModule],
  template: `
    <p-autocomplete
      [(ngModel)]="value"
      [suggestions]="suggestions"
      [optionLabel]="displayField"
      [placeholder]="placeholder"
      (completeMethod)="search($event)"
    >
    </p-autocomplete>
  `,
})
export class SearchBar implements OnChanges {
  @Input() itemsList: any[] = [];
  @Input() searchKeys: string[] = [];
  @Input() displayField: string = '';
  @Input() placeholder: string = 'Buscar...';

  value: any;
  suggestions: any[] = [];
  private fuse!: Fuse<any>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemsList'] || changes['searchKeys']) {
      this.initFuse();
    }
  }

  private initFuse(): void {
    this.fuse = new Fuse(this.itemsList, {
      keys: this.searchKeys,
      threshold: 0.4,
      ignoreLocation: true,
      isCaseSensitive: false,
      getFn: (obj: any, path: string | string[]): any => {
        // Si path es array, lo usamos directo; si es string, lo splitteamos
        const keys = Array.isArray(path) ? path : path.split('.');
        let val = obj;
        for (const key of keys) {
          val = val?.[key];
        }
        if (typeof val === 'string') {
          // Normaliza y quita acentos
          return val.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return val;
      },
    });
  }

  search(event: AutoCompleteCompleteEvent): void {
    if (!this.fuse) {
      this.initFuse();
    }
    const raw = event.query || '';
    const query = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    this.suggestions = query
      ? this.fuse.search(query).map((result) => result.item)
      : [];
  }
}
