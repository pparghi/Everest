import { TestBed } from '@angular/core/testing';

import { MemberClientsService } from './member-clients.service';

describe('MemberClientsService', () => {
  let service: MemberClientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemberClientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
