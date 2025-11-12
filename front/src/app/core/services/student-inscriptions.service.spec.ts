import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudentInscriptionsService } from './student-inscriptions.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('StudentInscriptionsService', () => {
  let service: StudentInscriptionsService;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['request']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getUserId']);
    auth.getUserId.and.returnValue('student-1');

    TestBed.configureTestingModule({
      providers: [
        StudentInscriptionsService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    });

    service = TestBed.inject(StudentInscriptionsService);
  });

  it('should load exam tables and normalize calls', (done) => {
    api.request.and.returnValue(
      of({
        data: [
          {
            id: 10,
            subjectName: 'Matemática',
            subjectId: 2,
            calls: [
              {
                id: 5,
                label: 'Primer llamado',
                examDate: '2025-11-01',
                enrollmentWindow: {
                  opensAt: '2025-10-01',
                  closesAt: '2025-10-15',
                },
              },
            ],
          },
        ],
      }),
    );

    service.listExamTables().subscribe((tables) => {
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        'students/inscriptions/exam-tables',
        undefined,
        {},
      );
      expect(tables.length).toBe(1);
      expect(tables[0].availableCalls[0].label).toBe('Primer llamado');
      expect(service.tables().length).toBe(1);
      done();
    });
  });

  it('should include studentId when enrolling', (done) => {
    api.request.and.returnValue(of({ ok: true }));

    service.enroll({ mesaId: 7, callId: 3 }).subscribe((response) => {
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        'students/inscriptions/exam-tables/7/enroll',
        {
          mesaId: 7,
          callId: 3,
          studentId: 'student-1',
          reasonCode: null,
        },
      );
      expect(response.ok).toBeTrue();
      done();
    });
  });

  it('should map backend errors into blocked enrollment responses', (done) => {
    api.request.and.returnValue(
      throwError(() => ({ error: { ok: false, reasonCode: 'quota_full' } })),
    );

    service.enroll({ mesaId: 1, callId: 2 }).subscribe((response) => {
      expect(response.ok).toBeFalse();
      expect(response.blocked).toBeTrue();
      expect(response.reasonCode).toBe('QUOTA_FULL');
      done();
    });
  });
});
