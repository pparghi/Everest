import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DocumentsReportsService {

  constructor(private http: HttpClient) { }

  callNOAIRISAPI(ClientKey: number, DebtorKey: number, FactorSignature: number) {
    const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&FactorSignature=${FactorSignature}`;

    // Make the GET request
    return this.http.get(url);
  }

}
