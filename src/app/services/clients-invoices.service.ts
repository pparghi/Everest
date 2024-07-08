import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse {
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientsInvoicesService { 

  constructor(private http: HttpClient) { }  

  getClientsInvoices(ClientKey: number): Observable<any> {        
    const url = `http://127.0.0.1:4201/api/clientsinvoices?ClientKey=${ClientKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.invoices.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }
}