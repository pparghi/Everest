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
export class ClientsService {

  constructor(private http: HttpClient) { }  

  getClients(DebtorKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/clients?DebtorKey=${DebtorKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clients.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client } 
          })),
        };
      })
    );
  }
}
