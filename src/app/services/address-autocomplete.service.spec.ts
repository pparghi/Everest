import { TestBed } from '@angular/core/testing';

import { AddressAutocompleteService } from './address-autocomplete.service';

describe('AddressAutocompleteService', () => {
  let service: AddressAutocompleteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddressAutocompleteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
