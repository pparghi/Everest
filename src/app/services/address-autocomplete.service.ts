import { Injectable } from '@angular/core';
declare const pca: {
  Address: new (options: { key: string; culture: string; maxSuggestions: number }) => {
    attach: (config: { search: string; country: string }) => void;
  };
};

@Injectable({
  providedIn: 'root'
})
export class AddressAutocompleteService {
  constructor() {
  }

  initializeAutocomplete(elementId: string) {
    console.log(elementId);
    
    if (typeof pca !== 'undefined' && typeof pca.Address !== 'undefined') {
      console.log('pca.Address is available:', pca.Address);
      
      try {
        const control = new pca.Address({
          key: 'dy85-mj85-wx29-nn39',
          culture: 'en-CA',
          maxSuggestions: 10
        });
  
        control.attach({
          search: elementId,
          country: 'CAN'
        });
      } catch (error) {
        console.error('Error initializing Address control:', error);
      }
    } else {
      console.error('pca is not defined or Address is not available');
    }
  }
}