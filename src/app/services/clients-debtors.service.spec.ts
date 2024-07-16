import { TestBed } from '@angular/core/testing';

import { ClientsDebtorsService } from './clients-debtors.service';

describe('ClientsDebtorsService', () => {
  let service: ClientsDebtorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientsDebtorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
