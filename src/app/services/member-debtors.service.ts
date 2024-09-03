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

  getMemberDebtors(mail: string, DebtorKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/memberDebtors?DebtorKey=${DebtorKey}`;
    const body = {
      "token" : mail
    }    
    return this.http.post<any>(url, body).pipe(
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