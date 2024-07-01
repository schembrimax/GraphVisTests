import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeJsTestComponent } from './tree-js-test.component';

describe('TreeJsTestComponent', () => {
  let component: TreeJsTestComponent;
  let fixture: ComponentFixture<TreeJsTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeJsTestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TreeJsTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
