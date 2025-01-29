import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiskMonitoringService {

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, sortBy: string, sortOrder: string, isActive: string, dueDateFrom: string, dueDateTo: string, DDCreatedBy: string, search: string, level: string, office: string, crm: string, isFuel: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/riskMonitoring?page=${page}&per_page=${perPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&isActive=${isActive}&dueDateFrom=${dueDateFrom}&dueDateTo=${dueDateTo}&DDCreatedBy=${DDCreatedBy}&search=${search}&level=${level}&office=${office}&crm=${crm}&isFuel=${isFuel}`;
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

  getClientGroupLevelList(){
    const url = `https://everest.revinc.com:4202/api/clientGroupLevelList`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clientGroupLevelList.map((item: any) => ({
            ...item 
          })),          
          clientGroupLevelList: response.clientGroupLevelList
        };
      })
    );
  }

  getCRMList(){
    const url = `https://everest.revinc.com:4202/api/CRMList`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.CRMList.map((item: any) => ({
            ...item 
          })),          
          CRMList: response.CRMList
        };
      })
    );
  }

  getOfficeList(){
    const url = `https://everest.revinc.com:4202/api/officeList`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.officeList.map((item: any) => ({
            ...item 
          })),          
          officeList: response.officeList
        };
      })
    );
  }

  getDDCreatedByList(){
    const url = `https://everest.revinc.com:4202/api/DDCreatedBy`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.DDCreatedBy.map((item: any) => ({
            ...item 
          })),          
          DDCreatedBy: response.DDCreatedBy
        };
      })
    );
  }

  getClientDetails(ClientKey: number){
    const url = `https://everest.revinc.com:4202/api/ClientDetails?ClientKey=${ClientKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.ClientDetails.map((item: any) => ({
            ...item 
          })),          
          ClientDetails: response.ClientDetails
        };
      })
    );
  }

  getClientContactsDetails(ClientKey: number){
    const url = `https://everest.revinc.com:4202/api/ClientContactsDetails?ClientKey=${ClientKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.ClientContactsDetails.map((item: any) => ({
            ...item 
          })),          
          ClientContactsDetails: response.ClientContactsDetails,
          ClientFuelOrNot: response.ClientFuelOrNot
        };
      })
    );
  }

  getMonitoringCategories(){
    const url = `https://everest.revinc.com:4202/api/MonitoringCategories`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.MonitoringCategories.map((item: any) => ({
            ...item 
          })),          
          MonitoringCategories: response.MonitoringCategories
        };
      })
    );
  }

  getMonitoringNotes(ClientKey: number, Category: string){
    const url = `https://everest.revinc.com:4202/api/MonitoringNotes?ClientKey=${ClientKey}&Category=${Category}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.MonitoringNotes.map((item: any) => ({
            ...item 
          })),          
          MonitoringNotes: response.MonitoringNotes
        };
      })
    );
  }
}
