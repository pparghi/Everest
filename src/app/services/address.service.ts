import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({

  providedIn: 'root',

})

export class AddressService {

 // private apiUrl = 'https://ws1.postescanada-canadapost.ca/Capture/Interactive/Find/v1.00/json3ex.ws'; // Replace with the correct API URL

  //private apiUrl = 'https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/wsdlnew.ws';
  private apiKey = 'dy85-mj85-wx29-nn39';
  private apiUrl = 'https://ws1.postescanada-canadapost.ca/Capture/Interactive/Find/v1.00/json3ex.ws';

  constructor(private http: HttpClient) {}

  getAddressSuggestions(query: string): Observable<any> {

    const headers = new HttpHeaders({
      'Cache-Control' : 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const params = new HttpParams()
     .set('Key', this.apiKey)
     .set('Text', query)
     .set('Country', 'CA')
     .set('MaxSuggestions', '5');
   
    // return this.http.get<any>(this.apiUrl, { headers, params });


     const timestamp = new Date().getTime();
     return this.http.get(`https://ws1.postescanada-canadapost.ca/Capture/Interactive/Find/v1.00/json3ex.ws?Key=dy85-mj85-wx29-nn39&Text=${query}&timestamp=${timestamp}`);
  }




} 
