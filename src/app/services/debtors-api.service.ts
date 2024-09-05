import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse {
  data: any[];
  debtorDocuments: any[];
  DocumentsFolder: any[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DebtorsApiService {

  constructor(private http: HttpClient) { }  

  getData(mail: string, page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
    const formData = new FormData();

    formData.append('token', mail);
    formData.append('page', page.toString());
    formData.append('per_page', perPage.toString());
    formData.append('search', search);
    formData.append('sortBy', sortBy);
    formData.append('sortOrder', sortOrder);
  
      return this.http.post<any>(`https://everest.revinc.com:4202/api/debtors`, formData).pipe(
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
    };

  // getData(mail: string, page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
  //   const url = `https://everest.revinc.com:4202/api/debtors?mail=${mail}&page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  //   return this.http.get<any>(url).pipe(
  //     map(response => {
  //       return {
  //         data: response.data.map((item: any) => ({
  //           ...item,
  //           expandedDetail: { detail: 'Additional details for ' + item.Debtor } // Add expanded detail here
  //         })),
  //         total: response.total['count_all'],
  //         noBuyDisputeList: response.DebtoNoBuyDisputeList
  //       };
  //     })
  //   );
  // }

  getDebtorsDocuments(DebtorKey: number): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/documentsList?DebtorKey=${DebtorKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          documentsList: response.documentsList.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),
          DocumentsCat: response.documentsCat,                    
          DocumentsFolder: response.documentsFolder                    
        };
      })
    );
  }

  getDebtorsContacts(DebtorKey: number): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/debtorContactsData?DebtorKey=${DebtorKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          debtorContactsData: response.debtorContactsData.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),              
        };
      })
    );
  }

  updateCreditLimit(DebtorKey: number, TotalCreditLimit: number, CredAppBy: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/updateDebtorCreditLimit?DebtorKey=${DebtorKey}&TotalCreditLimit=${TotalCreditLimit}&CredAppBy=${CredAppBy}`;
    const body = {
      DebtorKey: DebtorKey,
      TotalCreditLimit: TotalCreditLimit,
      CredAppBy: CredAppBy
    };
    return this.http.post<any>(url, body);
  }

  updateNobuyCode(DebtorKey: number, NoBuyDisputeKey: number, CredAppBy: string){
    const url = `https://everest.revinc.com:4202/api/updateDebtorAccountStatus?DebtorKey=${DebtorKey}&NoBuyDisputeKey=${NoBuyDisputeKey}&CredAppBy=${CredAppBy}`;    
    const body = {
      DebtorKey: DebtorKey,
      NoBuyDisputeKey: NoBuyDisputeKey,
      CredAppBy: CredAppBy
    };        
    return this.http.post<any>(url, body);
  }

  uploadDocument(formData: FormData){
    console.log(formData);
    
    const url = `https://everest.revinc.com:4202/api/debtorMasterAddDocument`;    
    const body = {
      // DebtorKey: formData.DebtorKey,
      // Descr: formData.Descr,
      // FileName: formData.FileName,
      // DocCatKey: formData.DocCatKey,
      // DocFolderPath: formData.DocFolderPath
    };        
    return this.http.post<any>(url, body);
  }
}