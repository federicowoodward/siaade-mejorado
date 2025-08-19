import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancePage } from './attendance-page';

describe('AttendancePage', () => {
  let component: AttendancePage;
  let fixture: ComponentFixture<AttendancePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
