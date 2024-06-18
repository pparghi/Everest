import { TestBed } from '@angular/core/testing';

import { ClientsInvoicesService } from './clients-invoices.service';

describe('ClientsInvoicesService', () => {
  let service: ClientsInvoicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientsInvoicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
