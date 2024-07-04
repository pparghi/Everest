import { TestBed } from '@angular/core/testing';

import { MasterClientsService } from './master-clients.service';

describe('MasterClientsService', () => {
  let service: MasterClientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MasterClientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
