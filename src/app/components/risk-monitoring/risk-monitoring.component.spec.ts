import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskMonitoringComponent } from './risk-monitoring.component';

describe('RiskMonitoringComponent', () => {
  let component: RiskMonitoringComponent;
  let fixture: ComponentFixture<RiskMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskMonitoringComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RiskMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
