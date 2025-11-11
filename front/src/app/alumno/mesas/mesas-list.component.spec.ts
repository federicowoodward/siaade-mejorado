import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MesasListComponent } from './mesas-list.component';
import { StudentInscriptionsService } from '../../core/services/student-inscriptions.service';
import { AuthService } from '../../core/services/auth.service';
import { ExamTableSyncService } from '../../core/services/exam-table-sync.service';

class InscriptionsStub {
  tables = signal<any[]>([]);
  loading = signal(false);
  listExamTables = jasmine.createSpy('listExamTables').and.returnValue(of([]));
  refresh = jasmine.createSpy('refresh').and.returnValue(of([]));
  enroll = jasmine.createSpy('enroll').and.returnValue(of({ ok: true }));
  logAudit = jasmine.createSpy('logAudit').and.returnValue(of(void 0));
}

class AuthStub {
  loadUserRoles = jasmine.createSpy('loadUserRoles').and.resolveTo([]);
  getUserId = jasmine.createSpy('getUserId').and.returnValue('student-1');
}

class SyncStub {
  changes$ = of();
  consumePendingFlag = jasmine
    .createSpy('consumePendingFlag')
    .and.returnValue(false);
  notify = jasmine.createSpy('notify');
}

describe('MesasListComponent', () => {
  let component: MesasListComponent;
  let fixture: ComponentFixture<MesasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesasListComponent],
      providers: [
        { provide: StudentInscriptionsService, useClass: InscriptionsStub },
        { provide: AuthService, useClass: AuthStub },
        { provide: MessageService, useValue: { add: () => undefined } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ExamTableSyncService, useClass: SyncStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MesasListComponent);
    component = fixture.componentInstance;
  });

  function buildRow(overrides?: Partial<any>): any {
    return {
      mesaId: 1,
      callId: 1,
      subjectId: 1,
      subjectName: 'Matematica',
      commissionLabel: 'A',
      windowRange: '01/01 - 05/01',
      call: {
        id: 1,
        label: 'Primer llamado',
        examDate: '2025-01-10',
        quotaTotal: 30,
        quotaUsed: 10,
        enrollmentWindow: { state: 'open', opensAt: '', closesAt: '' },
        additional: false,
      },
      table: {
        mesaId: 1,
        subjectId: 1,
        subjectName: 'Matematica',
        availableCalls: [],
        duplicateEnrollment: false,
        academicRequirement: null,
      },
      ...overrides,
    };
  }

  it('should allow enrollment when window is open', () => {
    const row = buildRow();
    expect(component.isActionBlocked(row)).toBeFalse();
  });

  it('should block enrollment when quota is full', () => {
    const row = buildRow({
      call: {
        id: 1,
        label: 'Primer llamado',
        examDate: '2025-01-10',
        quotaTotal: 10,
        quotaUsed: 10,
        enrollmentWindow: { state: 'open', opensAt: '', closesAt: '' },
        additional: false,
      },
    });
    expect(component.isActionBlocked(row)).toBeTrue();
  });
});
