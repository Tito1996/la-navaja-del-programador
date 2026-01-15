import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegexTools } from './regex-tools';

describe('RegexTools', () => {
  let component: RegexTools;
  let fixture: ComponentFixture<RegexTools>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegexTools]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegexTools);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
