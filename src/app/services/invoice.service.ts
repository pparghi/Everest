import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor(private http: HttpClient) { }

  //call the API to get invoice status list
  getInvoiceStatusList() {
    const url = `https://everest.revinc.com:4202/api/getInvoiceStatusList`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get Dispute Code List
  getDisputeCodeList() {
    const url = `https://everest.revinc.com:4202/api/getDisputeCodeList`;
    return this.http.get(url, {responseType: 'json'});
  }

  // Call the API to get invoice list
  getInvoicesList(clientNameLike: string, debtorNameLike: string, invDateInit: string, invDateEnd: string, invNo:string, referenceNo: string, status: string, office: string, ageInit:number, ageEnd:number, amountInit: number, amountEnd: number, paidDateIni: string, paidDateEnd: string, purchDateIni: string, purchDateEnd: string, crm: string, disputeCode: string, batchNo: string) {
    const ClientNameLike = clientNameLike;
    const DebtorNameLike = debtorNameLike;
    const InvDateInit = invDateInit;
    const InvDateEnd = invDateEnd;
    const InvNo = invNo;
    const ReferenceNo = referenceNo;
    const Status = status;
    const Office = office;
    const AgeInit = ageInit;
    const AgeEnd = ageEnd;
    const AmountInit = amountInit;
    const AmountEnd = amountEnd;
    const PaidDateIni = paidDateIni;
    const PaidDateEnd = paidDateEnd;
    const PurchDateIni = purchDateIni;
    const PurchDateEnd = purchDateEnd;
    const CRM = crm;
    const DisputeCode = disputeCode;
    const BatchNo = batchNo;

    const url = `https://everest.revinc.com:4202/api/getInvoicesList?clientNameLike=${ClientNameLike}&debtorNameLike=${DebtorNameLike}&invDateInit=${InvDateInit}&invDateEnd=${InvDateEnd}&invNo=${InvNo}&referenceNo=${ReferenceNo}&status=${Status}&office=${Office}&ageInit=${AgeInit}&ageEnd=${AgeEnd}&amountInit=${AmountInit}&amountEnd=${AmountEnd}&paidDateIni=${PaidDateIni}&paidDateEnd=${PaidDateEnd}&purchDateIni=${PurchDateIni}&purchDateEnd=${PurchDateEnd}&crm=${CRM}&disputeCode=${DisputeCode}&batchNo=${BatchNo}`;
    return this.http.get(url, {responseType: 'json'});
  }

}
