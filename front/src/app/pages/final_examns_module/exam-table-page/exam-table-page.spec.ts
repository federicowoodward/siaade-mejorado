import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamTablePage } from './exam-table-page';

describe('ExamTablePage', () => {
  let component: ExamTablePage;
  let fixture: ComponentFixture<ExamTablePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamTablePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamTablePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
