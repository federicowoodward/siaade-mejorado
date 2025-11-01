import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { CareerCatalogService } from '../../../../core/services/career-catalog.service';

@Component({
  selector: 'app-career-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './career-page.html',
  styleUrls: ['./career-page.scss'],
})
export class CareerPage implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);

  data = computed(() => ({
    career: this.catalog.career(),
    preceptor: this.catalog.preceptor(),
    academicPeriods: this.catalog.periods(),
  }));

  ngOnInit(): void {
    const careerId = 1;
    this.catalog.loadCareer(careerId).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar la carrera.');
        this.loading.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }
}
