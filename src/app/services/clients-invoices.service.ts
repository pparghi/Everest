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

  getClientsInvoices(ClientKey: number, DebtorKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/clientsinvoices?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}`;    
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

  getClientsInvoiceDetailNotes(InvoiceKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/invoiceDetailNotes?InvoiceKey=${InvoiceKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.invoiceDetailNotes.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }
}