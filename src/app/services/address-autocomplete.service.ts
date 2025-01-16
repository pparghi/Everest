import { Injectable } from '@angular/core';
declare var pca: any;

@Injectable({
  providedIn: 'root'
})
export class AddressAutocompleteService {
  constructor() {
    // pca.setup({
    //   key: 'dy85-mj85-wx29-nn39',
    //   culture: 'en-CA'
    // });
  }

  getSuggestions(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pca.search(query, (data: any) => {
        resolve(data);
      }, (error: any) => {
        reject(error);
      });
    });
  }
}