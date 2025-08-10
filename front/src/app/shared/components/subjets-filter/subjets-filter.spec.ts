import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjetsFilter } from './subjets-filter';

describe('SubjetsFilter', () => {
  let component: SubjetsFilter;
  let fixture: ComponentFixture<SubjetsFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjetsFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjetsFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
