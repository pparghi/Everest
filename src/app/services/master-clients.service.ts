import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterClientsService {

  constructor(private http: HttpClient) { }

  getData(page: number, perPage: number, search: string, sortBy: string, sortOrder: string, filterByBalance: string, filterByGroup: string, filterByGroupValue: string, filterByCRM: string): Observable<any> {
    const url = `https://everest.revinc.com:4202/api/masterClients?page=${page}&per_page=${perPage}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&filterByBalance=${filterByBalance}&filterByGroup=${filterByGroup}&filterByGroupValue=${filterByGroupValue}&filterByCRM=${filterByCRM}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        return {
          data: response.data.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client }
          })),
          total: response.total[""]          
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
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client }
          })),          
          clientGroupLevelList: response.clientGroupLevelList
        };
      })
    );
  }

  getClientGroupList(){
    const url = `https://everest.revinc.com:4202/api/clientGroupList`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clientGroupList.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client }
          })),          
          clientGroupList: response.clientGroupList,
          clientCRMList: response.clientCRMList
        };
      })
    );
  }

  getClientGroupValueList(GroupCodeKey: number){
    const url = `https://everest.revinc.com:4202/api/clientGroupValueList?GroupCodeKey=${GroupCodeKey}`;
    return this.http.get<any>(url).pipe(
      map(response => {        
        return {
          data: response.clientGroupValueList.map((item: any) => ({
            ...item,
            expandedDetail: { detail: 'Additional details for ' + item.Client }
          })),          
          clientGroupValueList: response.clientGroupValueList
        };
      })
    );
  }
}
