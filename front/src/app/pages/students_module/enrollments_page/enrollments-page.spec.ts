import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentsPage } from './enrollments-page';

describe('EnrollmentsPage', () => {
  let component: EnrollmentsPage;
  let fixture: ComponentFixture<EnrollmentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollmentsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrollmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
