import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  let component: ResetPasswordPage;
  let fixture: ComponentFixture<ResetPasswordPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
