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
  private editData: any; 
  setEditData(data: any) { this.editData = data; } 
  getEditData(): any { return this.editData; }

  constructor(private http: HttpClient) { }  

  // getData(mail: string, page: number, perPage: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
  //   const formData = new FormData();

  //   formData.append('token', mail);
  //   formData.append('page', page.toString());
  //   formData.append('per_page', perPage.toString());
  //   formData.append('search', search);
  //   formData.append('sortBy', sortBy);
  //   formData.append('sortOrder', sortOrder);
  
  //     return this.http.post<any>(`https://everest.revinc.com:4202/api/debtors`, formData).pipe(
  //       map(response => {
  //         return {
  //           data: response.data.map((item: any) => ({
  //             ...item,
  //             expandedDetail: { detail: 'Additional details for ' + item.Debtor } // Add expanded detail here
  //           })),
  //           total: response.total['count_all'],
  //           noBuyDisputeList: response.DebtoNoBuyDisputeList
  //         };
  //       })
  //     );
  //   };

  getData(mail: string, page: number, perPage: number, search: string, sortBy: string, sortOrder: string, filterByBalance: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/debtors?token=${mail}&page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&filterByBalance=${filterByBalance}`;
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
          debtorAudit: response.debtorAudit,
          debtorStatementsDetails: response.debtorStatementsDetails.map((item: any) => ({
            ...item,
            // Add expanded detail here
            expandedDetail: { detail: 'Additional details for ' + item.DtrName }
          }))
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

  getDebtorsPayments(DebtorKey: number, CheckNo: string, Amt: number, PostDateStart: string, PostDateEnd: string, LastPayments: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/DebtorChecksSearch?DebtorKey=${DebtorKey}&CheckNo=${CheckNo}&Amt=${Amt}&PostDateEnd=${PostDateEnd}&PostDateStart=${PostDateStart}&LastPayments=${LastPayments}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          payments: response.payments.map((item: any) => ({
            ...item,
         // Add expanded detail here
          })),                
        };
      })
    );
  }

  // get data for ticketing page Approve/Deny Credit Request window and trend tab
  getDebtorClientTrendData(DebtorKey: number, ClientNo: string, Type: string){    
    const url = `https://everest.revinc.com:4202/api/debtorHistoryTrend?DebtorKey=${DebtorKey}&ClientNo=${ClientNo}&Type=${Type}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            // Add expanded detail here
          })),              
        };
      })
    );
  }

  // search for debtor duns by debtor's name(required), address(optional), country(required)(CA or US)
  searchDuns(debtorName: string, debtorAddress: string, addressLine2: string, city: string, state: string, zipCode: string, country: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/searchDuns?Name=${debtorName}&Address=${debtorAddress}&AddressLine2=${addressLine2}&City=${city}&State=${state}&ZipCode=${zipCode}&Country=${country}`;
    return this.http.get(url, {responseType: 'json'});
  }

  /**
   * Updates debtor details in the database
   * @param debtorData FormData containing all debtor fields to update
   * @returns Observable with the API response
   */
  updateDebtorDetails(debtorData: FormData): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/updateDebtorDetails`;
    return this.http.post<any>(url, debtorData);
  }

  // Call the API to get debtor no buy Code List
  getDebtorNoBuyCodeList() {
    const url = `https://everest.revinc.com:4202/api/getDebtorNoBuyCodeList`;
    return this.http.get(url, {responseType: 'json'});
  }
  
  // Call the API to get country area List
  getCountryAreaList() {
    const url = `https://everest.revinc.com:4202/api/getCountryAreaList`;
    return this.http.get(url, {responseType: 'json'});
  }

  // update debtor's no buy code
  updateDebtorNoBuyCode(noBuyDisputeKey: number, debtorKey: number, credAppBy: string) {
    const url = `https://everest.revinc.com:4202/api/updateDebtorNoBuyCode`;
    const body = {
      NoBuyDisputeKey: noBuyDisputeKey,
      DebtorKey: debtorKey,
      CredAppBy: credAppBy
    };
    return this.http.post<any>(url, body);
  }

  // get debtor's alternate addresses
  getDebtorAlternateAddresses(debtorKey: number): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/getDebtorAlternateAddresses?DebtorKey=${debtorKey}`;
    return this.http.get(url, {responseType: 'json'});
  }

  // delete debtor's alternate address by AltAddressKey
  deleteDebtorAlternateAddress(DebtorKey: number, AltAddressKey: number, UpdateBy: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/deleteDebtorAlternateAddress`;
    const body = {
      DebtorKey: DebtorKey,
      AltAddressKey: AltAddressKey,
      UpdateBy: UpdateBy
    };
    return this.http.post<any>(url, body);
  }

  // delete debtor's alternate address by AltAddressKey
  addDebtorAlternateAddress(DebtorKey: number, Name: string, Addr1: string, Addr2: string, City: string, State: string, ZipCode: string, Country: string, UpdateBy: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/addDebtorAlternateAddress`;
    const body = {
      DebtorKey: DebtorKey,
      Name: Name,
      Addr1: Addr1,
      Addr2: Addr2,
      City: City,
      State: State,
      ZipCode: ZipCode,
      Country: Country,
      UpdateBy: UpdateBy
    };
    return this.http.post<any>(url, body);
  }


}