import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeSelector } from './mode-selector';

describe('ModeSelector', () => {
  let component: ModeSelector;
  let fixture: ComponentFixture<ModeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(ModeSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
