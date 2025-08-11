import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAcademicStatusPage } from './student-academic-status-page';

describe('StudentAcademicStatusPage', () => {
  let component: StudentAcademicStatusPage;
  let fixture: ComponentFixture<StudentAcademicStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAcademicStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAcademicStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
