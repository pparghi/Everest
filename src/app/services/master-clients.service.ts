import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterClientsService {

  private masterClientsApiUrl = 'http://127.0.0.1:8000/api/masterClients';

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
    const url = `http://127.0.0.1:4201/api/masterClients?page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client } 
          })),
          total: response.total['count_all']
        };
      })
    );
  }
}
