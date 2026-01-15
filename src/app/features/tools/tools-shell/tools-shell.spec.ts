import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsShell } from './tools-shell';

describe('ToolsShell', () => {
  let component: ToolsShell;
  let fixture: ComponentFixture<ToolsShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
