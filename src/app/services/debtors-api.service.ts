import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse {
  data: any[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DebtorsApiService {

  private debtorsApiUrl = 'http://127.0.0.1:8000/api/debtors';

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
    // Replace with your API endpoint
    const url = `http://127.0.0.1:8000/api/debtors?page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        // Mock data structure
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } // Add expanded detail here
          })),
          total: response.total['count_all']
        };
      })
    );
  }

  getMemberDebtors(DebtorKey: number): Observable<any> {        
    const url = `http://127.0.0.1:8000/api/memberDebtors?DebtorKey=${DebtorKey}`;    
    return this.http.get<any>(url);
  }
}