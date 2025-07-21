import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsDocumentsPage } from './appointments-documents-page';

describe('AppointmentsDocumentsPage', () => {
  let component: AppointmentsDocumentsPage;
  let fixture: ComponentFixture<AppointmentsDocumentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsDocumentsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsDocumentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
