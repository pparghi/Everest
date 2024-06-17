import { TestBed } from '@angular/core/testing';

import { MemberDebtorsService } from './member-debtors.service';

describe('MemberDebtorsService', () => {
  let service: MemberDebtorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemberDebtorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
