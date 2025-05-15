import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DocumentsReportsService {

  constructor(private http: HttpClient) { }

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

  // Call the API to get the PDF file
  callNOAIRISAPI(ClientKey: number, DebtorKey: number, FactorSignature: boolean, acknowledge_signature:boolean, bankingdetails:boolean, bankingdetails_included:boolean, 
    araging:boolean, email_debtor:boolean, email_client:boolean, email_crm:boolean, email_address:string) {
    // Construct the URL with the parameters
    const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=${email_debtor?1:0}&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}`;
    
    // const url = `https://everest.revinc.com:4202/api/callNOAIRISAPI?ClientKey=${ClientKey}&DebtorKey=${DebtorKey}&factor_signature=${FactorSignature?1:0}&acknowledge_signature=${acknowledge_signature?1:0}&bankingdetails=${bankingdetails?1:0}&bankingdetails_included=${bankingdetails_included?1:0}&araging=${araging?1:0}&email_debtor=0&email_client=${email_client?1:0}&email_crm=${email_crm?1:0}&email_address=${email_address}`;
    
    // Make the GET request
    return this.http.get(url, {responseType: 'json'});
  }

}
