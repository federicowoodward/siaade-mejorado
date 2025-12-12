import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermnsAndConditions } from './termns-and-conditions';

describe('TermnsAndConditions', () => {
  let component: TermnsAndConditions;
  let fixture: ComponentFixture<TermnsAndConditions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermnsAndConditions],
    }).compileComponents();

    fixture = TestBed.createComponent(TermnsAndConditions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
