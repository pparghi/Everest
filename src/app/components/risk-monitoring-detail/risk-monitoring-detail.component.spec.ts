import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskMonitoringDetailComponent } from './risk-monitoring-detail.component';

describe('RiskMonitoringDetailComponent', () => {
  let component: RiskMonitoringDetailComponent;
  let fixture: ComponentFixture<RiskMonitoringDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskMonitoringDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RiskMonitoringDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
