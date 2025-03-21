import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

  getData(email: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/login?mail=${email}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
          
          })),          
        };
      })
    );
  }

  getExchangeRatesByMonth(): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/exchangeRatesByMonth`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {          
          data: response.exchangeRatesByMonth.map((item: any) => ({
            ...item,
             
          })),          
          exchangeRatesByMonth: response.exchangeRatesByMonth         
        };
      })
    );
  }
}
