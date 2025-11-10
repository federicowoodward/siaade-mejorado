import { Component, OnInit, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    TagModule,
    BlockedActionDirective,
  ],
  templateUrl: './enrollments-page.html',
  styleUrl: './enrollments-page.scss',
})
export class EnrollmentsPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  finals = signal<any[]>([]);
  loading = signal(true);
  selectedFinal: any = null;
  showDialog = signal(false);

  enrolledFake = false;

  // Estado de bloqueo del usuario actual
  blocked$: Observable<boolean> = this.auth.getUser().pipe(map(u => !!u?.isBlocked));

  ngOnInit(): void {
    this.auth.getUser().subscribe((user) => {
      if (!user) return;

      this.api.getAll('final_exams_students').subscribe((allFinals) => {
        const studentFinals = allFinals.filter(
          (f) => f.studentId === user.id && !f.enrolled
        );
        
        if (studentFinals.length === 0) {
          this.finals.set([]);
          this.loading.set(false);
          return;
        }

        this.api.getAll('final_exams').subscribe((exams) => {
          this.api.getAll('subjects').subscribe((subjects) => {
            const data = studentFinals.map((final) => {
              const exam = exams.find((e) => e.id === final.finalExamsId);
              const subject = subjects.find((s) => s.id === exam?.subjectId);

              return {
                subject: subject?.subjectName,
                date: exam?.examDate,
                aula: exam?.aula,
                finalId: final.id,
              };
            });

            this.finals.set(data);
            this.loading.set(false);
          });
        });
      });
    });
  }

  openDialog(final: any) {
    this.selectedFinal = final;
    this.showDialog.set(true);
  }

  confirmInscription() {
    this.enrolledFake = true;
    this.showDialog.set(false);
  }

  cancelInscription() {
    this.enrolledFake = false;
    this.showDialog.set(false);
  }
}
