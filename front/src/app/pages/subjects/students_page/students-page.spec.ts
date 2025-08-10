import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsPage } from './students-page';

describe('StudentsPage', () => {
  let component: StudentsPage;
  let fixture: ComponentFixture<StudentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
