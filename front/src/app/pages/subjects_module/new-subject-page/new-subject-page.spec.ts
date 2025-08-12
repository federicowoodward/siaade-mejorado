import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSubjectPage } from './new-subject-page';

describe('NewSubjectPage', () => {
  let component: NewSubjectPage;
  let fixture: ComponentFixture<NewSubjectPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSubjectPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewSubjectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
