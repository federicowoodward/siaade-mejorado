import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalExamCreateDialog } from './final-exam-create-dialog';

describe('FinalExamCreateDialog', () => {
  let component: FinalExamCreateDialog;
  let fixture: ComponentFixture<FinalExamCreateDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalExamCreateDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalExamCreateDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
