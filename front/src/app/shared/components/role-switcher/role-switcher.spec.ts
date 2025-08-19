import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleSwitcher } from './role-switcher';

describe('RoleSwitcher', () => {
  let component: RoleSwitcher;
  let fixture: ComponentFixture<RoleSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSwitcher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
