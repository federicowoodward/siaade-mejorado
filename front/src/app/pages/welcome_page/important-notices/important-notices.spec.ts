import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportantNotices } from './important-notices';

describe('ImportantNotices', () => {
  let component: ImportantNotices;
  let fixture: ComponentFixture<ImportantNotices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportantNotices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportantNotices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
