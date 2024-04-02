import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexguiTestComponent } from './lexgui-test.component';

describe('LexguiTestComponent', () => {
  let component: LexguiTestComponent;
  let fixture: ComponentFixture<LexguiTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LexguiTestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LexguiTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
