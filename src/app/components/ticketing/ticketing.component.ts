import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { TicketingService } from '../../services/ticketing.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

interface DataItem {
  Client: string;
  expandedDetail: { detail: string };
} 

@Component({
  selector: 'app-ticketing',
  templateUrl: './ticketing.component.html',
  styleUrl: './ticketing.component.css'
})

export class TicketingComponent {  
    displayedColumns: string[] = ['expand', 'Debtor', 'Balance', '%Utilized', 'PastDue%', 'DSO', 'TotalCreditLimit', 'IndivCreditLimit', 'AIGLimit', 'Terms', 'CalcRateCode', 'CredExpireDate', 'RateDate', 'Edit', 'extra'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>();
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    statusList = '';
    requestDate = '';
    client!: number;
    readonly dialog = inject(MatDialog);    

    profile: any;
    user: any;    

    NavOptionMasterDebtor: any;
    NavAccessMasterDebtor: any;
    NavOptionClientRisk: any;
    NavAccessClientRisk: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    NavOptionMasterDebtorUpdate: any;
    NavAccessMasterDebtorUpdate: any;
    NavOptionUpdateMasterDebtor: any;
    NavAccessUpdateMasterDebtor: any;
    NavOptionRiskMonitoring: any;
    NavAccessRiskMonitoring: any;
    NavOptionRiskMonitoringRestricted: any;
    NavAccessRiskMonitoringRestricted: any;

    constructor(private dataService: TicketingService, private router: Router, private http: HttpClient, private loginService: LoginService) {      
    }
    ngOnInit(): void {      
      this.loadData();      
    }

    ngAfterViewInit(): void {            
      if(this.paginator){
        this.paginator.page.subscribe(() => this.loadData());  
      }  
      if (this.sort) {
        this.sort.sortChange.subscribe(() => {  
          if(this.paginator){
            this.paginator.pageIndex = 0;  
          }
          this.loadData();  
        });  
      }                     
    }

    loadData(): void {
      this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
        this.profile = profile;
        this.loginService.getData(this.profile.mail).subscribe(response => {                                
          response.data.forEach((element: any) => {
            if (element.NavOption == 'Master Debtor') {            
              this.NavOptionMasterDebtor = element.NavOption;          
              this.NavAccessMasterDebtor = element.NavAccess;
            } else if (element.NavOption == 'Client Risk Page'){
              this.NavOptionClientRisk = element.NavOption;          
              this.NavAccessClientRisk = element.NavAccess;
            } else if (element.NavOption == 'Update Master Debtor'){
              this.NavOptionUpdateMasterDebtor = element.NavOption;          
              this.NavAccessUpdateMasterDebtor = element.NavAccess;
            } else if (element.NavOption == 'Risk Monitoring'){
              this.NavOptionRiskMonitoring = element.NavOption;          
              this.NavAccessRiskMonitoring = element.NavAccess;
            } else if (element.NavOption == 'Risk Monitoring Restricted'){
              this.NavOptionRiskMonitoringRestricted = element.NavOption;          
              this.NavAccessRiskMonitoringRestricted = element.NavAccess;
            } else {
              this.NavOptionMasterDebtor = '';
              this.NavAccessMasterDebtor = '';
              this.NavOptionClientRisk = '';
              this.NavAccessClientRisk = '';       
              this.NavOptionUpdateMasterDebtor = '';       
              this.NavAccessUpdateMasterDebtor = ''; 
              this.NavOptionRiskMonitoring = '';
              this.NavAccessRiskMonitoring = '';
              this.NavOptionRiskMonitoringRestricted = '';
              this.NavAccessRiskMonitoringRestricted = '';
            }                                         
                        
          });
        }, error => {
          console.error('error--', error);
        });

        this.isLoading = true;      
        let sort = this.sort ? this.sort.active : '';
        let order = this.sort ? this.sort.direction : 'DESC';
        const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
        const pageSize = this.paginator ? this.paginator.pageSize : 25;

        const mail = btoa(this.profile.mail);        

        this.dataService.getData(this.statusList, this.requestDate, this.client, page ,pageSize, sort, order).subscribe(response => {                
          this.isLoading = false;
          this.dataSource.data = response.data;
          response.data.forEach((element: any) => {
            const total = element.total;          
            this.totalRecords = total;                
          });                                    
        });
      });
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadData();
    }
    
    get totalPages(): number { 
      const pageSize = this.paginator?.pageSize || 25;
      return Math.ceil(this.totalRecords /  pageSize); 
    } 
        
    goToPage(): void { 
      if (this.specificPage < 1 || this.specificPage > this.totalPages) { 
        return;             
      } 
      if (this.paginator) {
        this.paginator.pageIndex = this.specificPage - 1;
        this.loadData();
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;       
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

  onChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
               
      this.loadData();
  }
}
