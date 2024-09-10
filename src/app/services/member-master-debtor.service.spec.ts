import { TestBed } from '@angular/core/testing';

import { MemberMasterDebtorService } from './member-master-debtor.service';

describe('MemberMasterDebtorService', () => {
  let service: MemberMasterDebtorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemberMasterDebtorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
