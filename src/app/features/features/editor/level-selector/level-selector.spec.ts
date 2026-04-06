import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelSelector } from './level-selector';

describe('LevelSelector', () => {
  let component: LevelSelector;
  let fixture: ComponentFixture<LevelSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(LevelSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
