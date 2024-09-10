import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MemberMasterDebtorService {

  constructor(private http: HttpClient) { }
        
  getDebtorsMasterDebtor(DebtorKey: number, ClientKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/memberMasterDebtor?DebtorKey=${DebtorKey}&ClientKey=${ClientKey}`;        

    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.memberMasterDebtor.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }
}
