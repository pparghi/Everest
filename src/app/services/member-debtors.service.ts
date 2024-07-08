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
export class MemberDebtorsService { 

  constructor(private http: HttpClient) { }  

  getMemberDebtors(DebtorKey: number): Observable<any> {        
    const url = `http://127.0.0.1:4201/api/memberDebtors?DebtorKey=${DebtorKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.memberDebtor.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }
}