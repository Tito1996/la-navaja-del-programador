import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsHome } from './tools-home';

describe('ToolsHome', () => {
  let component: ToolsHome;
  let fixture: ComponentFixture<ToolsHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
