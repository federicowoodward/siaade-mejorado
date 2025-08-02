import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectTable } from './subject-table';

describe('SubjectTable', () => {
  let component: SubjectTable;
  let fixture: ComponentFixture<SubjectTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
