import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CacheService } from './cache.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentsReportsService {

  constructor(private http: HttpClient, private cacheService: CacheService) { }

  //call the API to get list of clients
  getClientsList() {
    const url = `https://everest.revinc.com:4202/api/getClientsList`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get the list of debtors based on the selected client
  getDebtorListByClientKey(ClientKey: number) {
    const clientKey = ClientKey ?? null;
    const url = `https://everest.revinc.com:4202/api/getDebtorsListByClientKey?clientKey=${clientKey}`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get the list of debtors based on the name of searching
  getDebtorsListByName(DebtorName: string) {
    const debtorName = DebtorName ?? '';
    const url = `https://everest.revinc.com:4202/api/getDebtorsListByName?debtorName=${debtorName}`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get the PDF file
  callNOAIRISAPI(ClientKey: number, DebtorKey: number, FactorSignature: boolean, acknowledge_signature:boolean, bankingdetails:boolean, bankingdetails_included:boolean, 
    araging:boolean, email_debtor:boolean, email_client:boolean, email_crm:boolean, email_address:string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=${email_debtor?1:0}&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}`;
    
    // const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=0&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}`;
    
    // Make the GET request
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get ansonia report url
  callAnsoniaAPI(MCNumber: string, Name: string, Address: string, City: string, State: string, Country: string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callAnsoniaAPI?MCNumber=${MCNumber}&Name=${Name}&Address=${Address}&City=${City}&State=${State}&Country=${Country}`;
    
    // Make the GET request
    return this.http.get<{ url: string }>(url, {responseType: 'json'});
  }
  
  // Call the API to get invoice pdf
  callInvoiceImageAPI(invoicekey: number, includeStamp: number) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callInvoiceImageAPI?invoicekey=${invoicekey}&includeStamp=${includeStamp}`;
    
    // Make the GET request
    // return this.http.get(url, {responseType: 'json'});

    return this.http.get(url, {responseType: 'json'}).pipe(
      tap((response: any) => {
        if (!(response && response?.status)) {
          // Clear the cache for this URL if the response is empty
          this.cacheService.put(url, null); // Optional: Cache null to avoid repeated calls
        }
      })
    );
  }

}
