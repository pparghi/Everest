import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterClientsService {

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, search: string, sortBy: string, sortOrder: string, filterByBalance: string, filterByGroup: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/masterClients?page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&filterByBalance=${filterByBalance}&filterByGroup=${filterByGroup}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client } 
          })),
          total: response.total[""],
          clientGroupLevelList: response.clientGroupLevelList
        };
      })
    );
  }
}
