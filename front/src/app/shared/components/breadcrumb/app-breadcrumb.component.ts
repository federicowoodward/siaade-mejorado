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

export interface SimpleBreadcrumbItem {
  label: string;
  routerLink?: string | any[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  template: `
    <p-breadcrumb
      *ngIf="model.length"
      [model]="model"
      styleClass="w-full"
    ></p-breadcrumb>
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
}
