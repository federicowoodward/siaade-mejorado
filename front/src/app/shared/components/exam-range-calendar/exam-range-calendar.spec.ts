import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamRangeCalendar } from './exam-range-calendar';

describe('ExamRangeCalendar', () => {
  let component: ExamRangeCalendar;
  let fixture: ComponentFixture<ExamRangeCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamRangeCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamRangeCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
