import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AcademicStatusComponent } from './academic-status.component';
import { StudentStatusService } from '../../core/services/student-status.service';

class StatusStub {
  status = signal<any[]>([]);
  loading = signal(false);
  loadStatus = jasmine.createSpy('loadStatus').and.returnValue(of([]));
}

describe('AcademicStatusComponent', () => {
  let component: AcademicStatusComponent;
  let fixture: ComponentFixture<AcademicStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicStatusComponent],
      providers: [
        { provide: StudentStatusService, useClass: StatusStub },
        { provide: MessageService, useValue: { add: () => undefined } },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicStatusComponent);
    component = fixture.componentInstance;
  });

  it('should map block info for window closed reason', () => {
    const info = component.blockInfo('WINDOW_CLOSED');
    expect(info?.variant).toBe('institutional');
    expect(info?.title).toContain('Ventana');
  });

  it('should navigate to mesas with subject id', async () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.goToMesas(5);
    expect(router.navigate).toHaveBeenCalledWith(['/alumno/mesas'], {
      queryParams: { subjectId: 5 },
    });
  });
});
