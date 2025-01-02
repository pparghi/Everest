import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiskMonitoringService {

  constructor(private http: HttpClient) { }

  getData(isActive: string ): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/riskMonitoring?isActive=${isActive}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client } 
          })),
          // total: response.total[""]          
        };
      })
    );
  }
}
