import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportantNoticesComponent } from './important-notices';

describe('ImportantNoticesComponent', () => {
  let component: ImportantNoticesComponent;
  let fixture: ComponentFixture<ImportantNoticesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportantNoticesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportantNoticesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
