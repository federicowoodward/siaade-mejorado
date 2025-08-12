import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamsTablesPage } from './exams-tables-page';

describe('ExamsTablesPage', () => {
  let component: ExamsTablesPage;
  let fixture: ComponentFixture<ExamsTablesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamsTablesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamsTablesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
