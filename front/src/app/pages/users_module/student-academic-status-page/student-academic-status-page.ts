// #ASUMIENDO CODIGO: src/app/pages/students/student-academic-status-page/student-academic-status-page.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AcademicStatus,
  StudentMinimal,
} from '../../../shared/components/academic_status/academic-status-component';
import { ApiService } from '../../../core/services/api.service';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';

@Component({
  selector: 'app-student-academic-status-page',
  standalone: true,
  imports: [CommonModule, AcademicStatus, Button],
  template: `
    <div class="m-w-custom flex flex-column gap-3">
      <p-button
        label="Volver a tabla"
        icon="pi-arrow-rigth"
        iconPos="left"
        (onClick)="back()"
      ></p-button>

      <h2>Situación Académica del Estudiante</h2>
      <app-academic-status
        [student]="student()"
      ></app-academic-status>
    </div>
  `,
})
export class StudentAcademicStatusPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService);

  // this is a signal we *own* and can .set()
  student = signal<StudentMinimal | undefined>(undefined);

  constructor(private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.api.getById('users', id).subscribe((u: any) => {
      if (!u?.id) return;
      this.student.set({
        id: u.id,
        name: u.name,
        lastName: u.lastName,
        cuil: u.cuil,
      });
    });
  }

  back(): void {
    this.goBack.back();
  }
}
