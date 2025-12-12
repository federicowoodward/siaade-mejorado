import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

export interface SimpleBreadcrumbItem {
  label: string;
  routerLink?: string | any[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule],
  template: `
    <div class="flex align-items-center justify-content-between gap-2 my-3">
      <p-breadcrumb
        *ngIf="model.length"
        [model]="model"
        styleClass="w-full"
      ></p-breadcrumb>
      <div class="flex align-items-center gap-2">
        <ng-content></ng-content>
        <p-button
          label="Volver"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined="true"
          (onClick)="back()"
        ></p-button>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .p-breadcrumb {
        background: transparent !important;
        background-color: transparent !important;
        padding-left: 0 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBreadcrumbComponent implements OnChanges {
  @Input({ required: true }) items: SimpleBreadcrumbItem[] = [];

  model: MenuItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if ('items' in changes) {
      const items = this.items ?? [];
      this.model = items.map((item) => ({
        label: item.label,
        routerLink: item.routerLink,
      }));
    }
  }

  back() {
    window.history.back();
  }
}
