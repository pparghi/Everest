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
          ClientDetails: response.ClientDetails,
          LevelHistory: response.LevelHistory,
          ClientLevelDetail: response.ClientLevelDetail
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

  getMonitoringNotes(ClientKey: number, Category: string, Hidden: string){
    const url = `https://everest.revinc.com:4202/api/MonitoringNotes?ClientKey=${ClientKey}&Category=${Category}&Hidden=${Hidden}`;
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

  addNotesRisk(ClientKey: string, Category: string, Notes: string, Currency: string, Risk: string, CreatedBy: string, DueDate: string){
      const url = `https://everest.revinc.com:4202/api/addNotesRisk`;
      const formData = new FormData();
    formData.append('ClientKey', ClientKey);
    formData.append('Category', Category);
    formData.append('Notes', Notes);
    formData.append('Currency', Currency);
    formData.append('Risk', Risk);
    formData.append('CreatedBy', CreatedBy);
    formData.append('DueDate', DueDate);

      return this.http.post<any>(url, formData)
  }

  updateCRMRisk(ClientKey: string, CRM: string, UserKey: string){
      const url = `https://everest.revinc.com:4202/api/updateCRMRisk?ClientKey=${ClientKey}&CRM=${CRM}&UserKey=${UserKey}`;
      const formData = new FormData();
      formData.append('ClientKey', ClientKey);
      formData.append('CRM', CRM);
      formData.append('UserKey', UserKey);
    
      return this.http.post<any>(url, formData);
  }

  updateLevelRisk(ClientKey: string, GroupValue: string, UserKey: string){
      const url = `https://everest.revinc.com:4202/api/updateLevelRisk?ClientKey=${ClientKey}&GroupValue=${GroupValue}&UserKey=${UserKey}`;
      const formData = new FormData();
      formData.append('ClientKey', ClientKey);
      formData.append('GroupValue', GroupValue);
      formData.append('UserKey', UserKey);
      return this.http.post<any>(url, formData);
  }

  updateCompleteStatusRisk(ClientNoteKey: string, Complete: string){
      const url = `https://everest.revinc.com:4202/api/updateCompleteStatusRisk?ClientNoteKey=${ClientNoteKey}&Complete=${Complete}`
      const formData = new FormData();
      formData.append('ClientNoteKey', ClientNoteKey);
      formData.append('Complete', Complete);
      return this.http.post<any>(url, formData);
  }

  clientNotesHide(ClientNoteKey: string, UserKey: string, Hide: string){
    const url = `https://everest.revinc.com:4202/api/ClientNotesHide?ClientNoteKey=${ClientNoteKey}&UserKey=${UserKey}&Hide=${Hide}`
    const formData = new FormData();
    formData.append('ClientNoteKey', ClientNoteKey);
    formData.append('UserKey', UserKey);
    formData.append('Hide', Hide);
    return this.http.post<any>(url, formData);
  }

  /**
   * Get client summary note from the API
   * @param clientKey The client key
   * @returns Observable with the client summary note
   */
  getClientSummaryNote(clientKey: number): Observable<any> {
    return this.http.get<any>(`https://everest.revinc.com:4202/api/getClientSummaryNote?ClientKey=${clientKey}`);
  }

  /**
   * Update client summary note
   * @param clientKey The client key
   * @param summaryText The summary text to save
   * @returns Observable with the update result
   */
  setClientSummaryNote(clientKey: number, summaryText: string): Observable<any> {
    const payload = {
      ClientKey: clientKey,
      SummaryText: summaryText
    };
    
    return this.http.post<any>(`https://everest.revinc.com:4202/api/setClientSummaryNote`, payload);
  }
}
