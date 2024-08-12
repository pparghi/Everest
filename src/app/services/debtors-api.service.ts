import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse {
  data: any[];
  debtorDocuments: any[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DebtorsApiService {

  private debtorsApiUrl = 'http://127.0.0.1:8000/api/debtors';

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
    const url = `http://127.0.0.1:4201/api/debtors?page=${page}&TotalCreditLimit=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Debtor } // Add expanded detail here
          })),
          total: response.total['count_all'],
          noBuyDisputeList: response.DebtoNoBuyDisputeList
        };
      })
    );
  }

  getDebtorsDocuments(DebtorKey: number): Observable<any> {
    const url = `http://127.0.0.1:4201/api/documentsList?DebtorKey=${DebtorKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          documentsList: response.documentsList.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),
          DocumentsCat: response.documentsCat                    
        };
      })
    );
  }

  updateCreditLimit(DebtorKey: number, TotalCreditLimit: number, CredAppBy: string): Observable<any> {
    const url = `http://127.0.0.1:4201/api/updateDebtorCreditLimit?DebtorKey=${DebtorKey}&TotalCreditLimit=${TotalCreditLimit}&CredAppBy=${CredAppBy}`;
    const body = {
      DebtorKey: DebtorKey,
      TotalCreditLimit: TotalCreditLimit,
      CredAppBy: CredAppBy
    };
    return this.http.post<any>(url, body);
  }

  updateNobuyCode(DebtorKey: number, NoBuyDisputeKey: number, CredAppBy: string){
    const url = `http://127.0.0.1:4201/api/updateDebtorAccountStatus?DebtorKey=${DebtorKey}&NoBuyDisputeKey=${NoBuyDisputeKey}&CredAppBy=${CredAppBy}`;    
    const body = {
      DebtorKey: DebtorKey,
      NoBuyDisputeKey: NoBuyDisputeKey,
      CredAppBy: CredAppBy
    };        
    return this.http.post<any>(url, body);
  }

  uploadDocument(DebtorKey: number, Descr: String, FileName: String, DocCatKey: number){
    const url = `http://127.0.0.1:4201/api/debtorMasterAddDocument?DebtorKey=${DebtorKey}&Descr=${Descr}&FileName=${FileName}&DocCatKey=${DocCatKey}`;    
    const body = {
      DebtorKey: DebtorKey,
      Descr: Descr,
      FileName: FileName,
      DocCatKey: DocCatKey
    };        
    return this.http.post<any>(url, body);
  }
}