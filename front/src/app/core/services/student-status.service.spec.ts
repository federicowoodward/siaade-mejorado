import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudentStatusService } from './student-status.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('StudentStatusService', () => {
  let service: StudentStatusService;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['request']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getUserId']);
    auth.getUserId.and.returnValue('student-1');

    TestBed.configureTestingModule({
      providers: [
        StudentStatusService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });

    service = TestBed.inject(StudentStatusService);
  });

  it('should map subjects and action context', (done) => {
    api.request.and.callFake((method: string, url: string) => {
      if (url === 'students/status/subjects') {
        return of({
          subjects: [
            {
              subjectId: 3,
              subjectName: 'Fisica',
              year: 2,
              partials: 4,
              note1: 6,
              note2: 7,
              attendancePercentage: 80,
              condition: 'Regular',
            },
          ],
        }) as any;
      }
      if (url === 'students/status/action-context') {
        return of({
          courseWindow: {
            opensAt: '2000-01-01',
            closesAt: '2099-12-31',
          },
          examWindow: {
            opensAt: '2000-01-01',
            closesAt: '2099-12-31',
          },
        }) as any;
      }
      return of({}) as any;
    });

    service.loadStatus().subscribe((cards) => {
      expect(cards.length).toBe(1);
      expect(cards[0].subjectName).toBe('Fisica');
      expect(cards[0].actions.canEnrollExam).toBeTrue();
      expect(service.status().length).toBe(1);
      done();
    });
  });

  it('should fallback to catalogs endpoint when subjects request fails', (done) => {
    const catalogsPayload = {
      byYear: {
        '1 Ano': [
          {
            subjectId: 9,
            subjectName: 'Historia',
            note1: 8,
            note2: 9,
            attendancePercentage: 95,
            condition: 'Promocionado',
          },
        ],
      },
    };

    api.request.and.callFake((method: string, url: string) => {
      if (url === 'students/status/subjects') {
        return throwError(() => new Error('not implemented'));
      }
      if (url === 'catalogs/student/student-1/academic-status') {
        return of(catalogsPayload as any) as any;
      }
      if (url === 'students/status/action-context') {
        return of({}) as any;
      }
      return of({}) as any;
    });

    service.loadStatus().subscribe((cards) => {
      expect(cards.length).toBe(1);
      expect(cards[0].subjectName).toBe('Historia');
      expect(cards[0].yearLabel).toBe('1 Ano');
      done();
    });
  });
});
