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

  // Call the API to get the list of debtors based on the selected client, excluding DEBTOR DOES NOT PAY FACTOR of nobuy debtors
  getNOADebtorsListByClientKey(ClientKey: number) {
    const clientKey = ClientKey ?? null;
    const url = `https://everest.revinc.com:4202/api/getNOADebtorsListByClientKey?clientKey=${clientKey}`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get the list of debtors based on the selected client
  getDebtorsListByClientKey(ClientKey: number) {
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
  callNOAIRISAPI(ClientKey: number, DebtorKey: string, FactorSignature: boolean, acknowledge_signature:boolean, bankingdetails:boolean, bankingdetails_included:boolean, 
    araging:boolean, email_debtor:boolean, email_client:boolean, email_crm:boolean, email_address:string, email_contactname:string, email_contactemail:string, email_contactext:string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=${email_debtor?1:0}&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}&email_contactname=${email_contactname}&email_contactemail=${email_contactemail}&email_contactext=${email_contactext}`;
    
    // const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=0&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}`;
    console.log('Single email API URL:', url);
    // Make the GET request
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get the PDF file
  callNOAIRISAPISendBulkEmail(ClientKey: number, DebtorKey: string, FactorSignature: boolean, acknowledge_signature:boolean, bankingdetails:boolean, bankingdetails_included:boolean, 
    araging:boolean, email_debtor:boolean, email_client:boolean, email_crm:boolean, email_address:string, email_contactname:string, email_contactemail:string, email_contactext:string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=${email_debtor?1:0}&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}&email_contactname=${email_contactname}&email_contactemail=${email_contactemail}&email_contactext=${email_contactext}`;
    console.log('Bulk email API URL:', url);
    // no response
    this.http.get(url).subscribe();
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

  // Call the IRIS release letter API to get single LOR PDF
  callLORCreatePDFAPI(ClientKey: number, DebtorKey: number, Marknobuy: boolean, Watermark:boolean, EmailDebtor:boolean) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callLORCreatePDFAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&Marknobuy=${Marknobuy?1:0}&Watermark=${Watermark?1:0}&EmailDebtor=${EmailDebtor?1:0}`;
    
    // Make the GET request
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the IRIS release letter API to create LOR PDF or send emails to all debtors
  callLORCreatePDFsAPI(ClientKey: number, Marknobuy: boolean, Watermark: boolean, Sendemail: boolean, userExtension: string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callLORCreatePDFsAPI?ClientKey=${ClientKey}&Marknobuy=${Marknobuy?1:0}&Watermark=${Watermark?1:0}&Sendemail=${Sendemail?1:0}&UserExtension=${userExtension}`;
    
    // Make the GET request
    this.http.get(url).subscribe();
  }

  //region client documents
  //call the API to get list of client document categories
  getClientDocumentCategory() {
    const url = `https://everest.revinc.com:4202/api/getClientDocumentCategory`;
    return this.http.get(url, {responseType: 'json'});
  }

  // get the list of client documents based on client name, category, and file name
  getClientDocumentList(client: string, category: string, fileNameContains: string) {
    const url = `https://everest.revinc.com:4202/api/getClientDocumentList?ClientName=${client}&DocCatKey=${category}&FileName=${fileNameContains}`;
    return this.http.get(url, {responseType: 'json'});
  }

  //call the API to get both master and memeber client list
  getClientFullList() {
    const url = `https://everest.revinc.com:4202/api/getClientFullList`;
    return this.http.get(url, {responseType: 'json'});
  }

  //endregion client documents

  
  //region dashboard reports
  //call the API to get list of debtors for report
  getFullDebtorListForReport() {
    const url = `https://everest.revinc.com:4202/api/getFullDebtorListForReport`;
    return this.http.get(url, {responseType: 'json'});
  }

}
