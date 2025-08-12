import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalExamPage } from './final-exam-page';

describe('FinalExamPage', () => {
  let component: FinalExamPage;
  let fixture: ComponentFixture<FinalExamPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalExamPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalExamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
