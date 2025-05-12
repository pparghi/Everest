import { TestBed } from '@angular/core/testing';

import { DocumentsReportsService } from './documents-reports.service';

describe('DocumentsReportsService', () => {
  let service: DocumentsReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentsReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
