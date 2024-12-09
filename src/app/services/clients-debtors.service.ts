import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsDebtorsService {

  constructor(private http: HttpClient) { }  

  getClientsDebtors(ClientKey: number): Observable<any> {        
    const url = `https://everest.revinc.com:4202/api/ClientsDebtors?ClientKey=${ClientKey}`;    
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clientsDebtor.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } 
          })),
        };
      })
    );
  }

  getDebtorsPayments(DebtorKey: number, ClientKey: number){    
    const url = `https://everest.revinc.com:4202/api/debtorPaymentsData?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          debtorPaymentsData: response.debtorPaymentsData.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),              
        };
      })
    );
  }

  getDebtorsPaymentsImages(PmtChecksKey: number){         
    const url = `https://everest.revinc.com:4202/api/debtorPaymentsImages?PmtChecksKey=${PmtChecksKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          debtorPaymentImages: response.debtorPaymentImages.map((item: any) => ({
            ...item,         
          })),              
        };
      })
    );
  }

  convertDebtorsPaymentsImages(PmtChecksKey: number){   
    const url = `https://login.baron.finance/iris/public/test/everest_payment_images.php?PmtChecksKey=${PmtChecksKey}`;   
    return this.http.get(url);
  }

  getMiscData(DebtorKey: number, ClientKey: number){    
    const url = `https://everest.revinc.com:4202/api/MiscDataList?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          MiscDataList: response.MiscDataList.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),              
        };
      })
    );
  }
}
