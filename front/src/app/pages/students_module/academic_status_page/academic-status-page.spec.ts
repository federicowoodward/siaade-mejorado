import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicStatusPage } from './academic-status-page';

describe('AcademicStatusPage', () => {
  let component: AcademicStatusPage;
  let fixture: ComponentFixture<AcademicStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
