import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Audit } from './audit';

describe('Audit', () => {
  let component: Audit;
  let fixture: ComponentFixture<Audit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Audit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Audit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
