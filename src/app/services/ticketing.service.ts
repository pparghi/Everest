import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TicketingService {

  constructor(private http: HttpClient) { }

  getData(StatusList: string, RequestDate: string, ClientNo: number, page: number, perPage: number, sortBy: string, sortOrder: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/debtors?StatusList=${StatusList}&RequestDate=${RequestDate}&ClientNo=${ClientNo}&page=${page}&perPage=${perPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor }
          })),
          total: response.total['count_all'],          
        };
      })
    );
  }
}
