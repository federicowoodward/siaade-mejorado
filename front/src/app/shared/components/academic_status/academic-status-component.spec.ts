import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicStatus } from './academic-status-component';

describe('AcademicStatus', () => {
  let component: AcademicStatus;
  let fixture: ComponentFixture<AcademicStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
