import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CSVisualisationComponent } from './CSVisualisationComponent';

describe('CSVisualisationComponent', () => {
  let component: CSVisualisationComponent;
  let fixture: ComponentFixture<CSVisualisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CSVisualisationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CSVisualisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
