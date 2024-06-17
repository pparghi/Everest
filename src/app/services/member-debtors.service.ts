import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MemberDebtorsService {

  private memberDebtorsApiUrl = 'http://127.0.0.1:8000/api/memberDebtors';

  constructor(private http: HttpClient) { }

  getData(DebtorKey: number): Observable<any> {    

    let params = new HttpParams()
     .set('DebtorKey', DebtorKey)     
      return this.http.get<any>(`${this.memberDebtorsApiUrl}?DebtorKey=${DebtorKey}`);

  }
}
