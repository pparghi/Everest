import { TestBed } from '@angular/core/testing';

import { RiskMonitoringService } from './risk-monitoring.service';

describe('RiskMonitoringService', () => {
  let service: RiskMonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RiskMonitoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
