import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsDebtorsService {

  constructor(private http: HttpClient) { }  

  getClientsDebtors(ClientKey: number): Observable<any> {        
    const url = `http://127.0.0.1:4201/api/ClientsDebtors?ClientKey=${ClientKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clientsDebtor.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }
}
