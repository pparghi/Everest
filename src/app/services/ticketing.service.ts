import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TicketingService {

  constructor(private http: HttpClient) { }

  getData(StatusList: string, RequestDate: string, ClientNo: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/creditRequests?StatusList=${StatusList}&RequestDate=${RequestDate}&ClientNo=${ClientNo}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor }
          })),                   
        };
      })
    );
  }


  // function to get the credit request status list
  getCreditRequestStatusList(): Observable<any> {
    const url = 'https://everest.revinc.com:4202/api/getCreditRequestStatusList';
    return this.http.get(url, {responseType: 'json'});
  }

  // function to approve a credit request
  approveCreditRequest(credRequestKey: string, approveUser: string, status: string, response: string, approvedLimit: string, newLimitAmt: string, expMonths: string, email: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/approveCreditRequest`;
    
    const formData = new FormData();
    formData.append('CredRequestKey', credRequestKey);
    formData.append('ApproveUser', approveUser);
    formData.append('Status', status);
    formData.append('Response', response);
    formData.append('ApprovedLimit', approvedLimit);
    formData.append('NewLimitAmt', newLimitAmt);
    formData.append('ExpMonths', expMonths);
    formData.append('Email', email);

    return this.http.post<any>(url, formData);
  }

  // function to approve a credit request version 2
  approveCreditRequest2(credRequestKey: string, approveUser: string, status: string, response: string, newTotalCreditLimit: string, newIndivCreditLimit: string, expMonths: string, email: string, changeMaster:string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/approveCreditRequest2`;
    
    const formData = new FormData();
    formData.append('CredRequestKey', credRequestKey);
    formData.append('ApproveUser', approveUser);
    formData.append('Status', status);
    formData.append('Response', response);
    formData.append('NewTotalCreditLimit', newTotalCreditLimit);
    formData.append('NewIndivCreditLimit', newIndivCreditLimit);
    formData.append('ExpMonths', expMonths);
    formData.append('Email', email);
    formData.append('ChangeMaster', changeMaster);

    return this.http.post<any>(url, formData);
  }

  // function to get or modify a credit request current user
  actionToCreditRequest(credRequestKey: number, inUseUser: string, lockUnlock: string): Observable<any> {
    const params = new HttpParams()
    .set('CredRequestKey', credRequestKey)
    .set('InUseUser', inUseUser)
    .set('LockUnlock', lockUnlock); // valid value: U or L
  
  // Use GET method with params
  return this.http.get<any>('https://everest.revinc.com:4202/api/actionToCreditRequest', { params });
}
}
