import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserModal } from './user-modal';

describe('UserModal', () => {
  let component: UserModal;
  let fixture: ComponentFixture<UserModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
