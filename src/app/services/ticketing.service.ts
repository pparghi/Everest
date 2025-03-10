import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TicketingService {

  constructor(private http: HttpClient) { }

  getData(StatusList: string, RequestDate: string, ClientNo: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/creditRequests?StatusList=${StatusList}&RequestDate=${RequestDate}&ClientNo=${ClientNo}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor }
          })),                   
        };
      })
    );
  }
}
