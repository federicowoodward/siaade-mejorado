import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalExamCreateDialogComponent } from './final-exam-create-dialog';

describe('FinalExamCreateDialogComponent', () => {
  let component: FinalExamCreateDialogComponent;
  let fixture: ComponentFixture<FinalExamCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalExamCreateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalExamCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
