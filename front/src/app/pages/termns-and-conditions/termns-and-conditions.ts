import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBreadcrumbComponent } from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-termns-and-conditions',
  standalone: true,
  imports: [CommonModule, AppBreadcrumbComponent],
  templateUrl: './termns-and-conditions.html',
  styleUrl: './termns-and-conditions.scss',
})
export class TermnsAndConditions {}
