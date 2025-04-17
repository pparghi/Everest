import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { TicketingService } from '../../services/ticketing.service';
import { DatePipe } from '@angular/common';
import { MatTableExporterDirective } from 'mat-table-exporter';
import { FilterService } from '../../services/filter.service';
import * as XLSX from 'xlsx';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

interface DataItem {
  Client: string;
  expandedDetail: { detail: string };
} 

@Component({
  selector: 'app-ticketing',
  templateUrl: './ticketing.component.html',
  styleUrl: './ticketing.component.css',
  providers: [DatePipe]
})

export class TicketingComponent {  
    displayedColumns: string[] = ['expand', 'RequestNo', 'Debtor', 'Client', 'TotalCreditLimit', 'Status', 'IndivCreditLimit', 'RequestAmt', 'RequestUser', 'Office', 'BankAcctName', 'RequestDate', 'CreditType', 'Edit'];    
    statusListOptions = [
      { label: 'Pending', value: '0' },
      { label: 'Approved', value: '1' },
      { label: 'Declined', value: '2' },
      { label: 'Held', value: '3' }
    ];
    selectedValues: string[] = [];
    selectedValuesString: string = '';
    isLoading = true;
    dataSource = new MatTableDataSource<any>();
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    statusList = '1';
    requestDate: any;
    client = '';
    readonly dialog = inject(MatDialog);    

    profile: any;
    user: any;    

    NavOptionMasterDebtor: any;
    NavAccessMasterDebtor: any;
    NavOptionClientRisk: any;
    NavAccessClientRisk: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTableExporterDirective) exporter!: MatTableExporterDirective;  
    @ViewChild('table', { static: false }) table!: ElementRef;

    NavOptionMasterDebtorUpdate: any;
    NavAccessMasterDebtorUpdate: any;
    NavOptionUpdateMasterDebtor: any;
    NavAccessUpdateMasterDebtor: any;
    NavOptionRiskMonitoring: any;
    NavAccessRiskMonitoring: any;
    NavOptionRiskMonitoringRestricted: any;
    NavAccessRiskMonitoringRestricted: any;

    constructor(private dataService: TicketingService, private router: Router, private http: HttpClient, private loginService: LoginService, private datePipe: DatePipe, private filterService: FilterService) {         
      const today = new Date();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(today.getDate() - 1);
      this.requestDate = this.datePipe.transform(yesterdayDate, 'yyyy-MM-dd');      
    }
    ngOnInit(): void {
      // load filter state from filter service
      const filterValues = this.filterService.getFilterState('ticketing');
      if (filterValues?.selectedValues) {
        this.selectedValues = filterValues.selectedValues;
      }
      else {
        this.selectedValues = this.statusListOptions.map(option => option.value);
      }
      if (filterValues?.requestDate) {
        this.requestDate = filterValues.requestDate;
      }
      
      this.selectedValuesString = this.selectedValues.join(', ');      
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
        const mail = btoa(this.profile.mail);             

        this.dataService.getData(this.selectedValuesString, this.requestDate, this.client).subscribe(response => {                
          this.isLoading = false;
          this.dataSource.data = response.data;                                              
        });
      });
    }

    onCheckboxChange(event: Event): void {
      const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedValues.push(checkbox.value);
    } else {
      const index = this.selectedValues.indexOf(checkbox.value);
      if (index > -1) {
        this.selectedValues.splice(index, 1);
      }
    }
    this.selectedValuesString = this.selectedValues.join(', ');
    this.filterService.setFilterState('ticketing', { "selectedValues": this.selectedValues });  
      this.loadData();
    }

    isChecked(value: string): boolean {
      return this.selectedValues.includes(value);
    }

    onChangeRequestDate(event: Event){
      const selectElement = event.target as HTMLSelectElement;
      this.requestDate = selectElement.value   
      this.filterService.setFilterState('ticketing', { "requestDate": this.requestDate }); 
      this.loadData();
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

  edit(element: DataItem){
    
  }

  exportTable() {        
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const filteredData = data.map((row: any[]) => {
      return row.slice(1, -1); 
    });

    const newWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(filteredData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, newWs, 'Sheet1');
    XLSX.writeFile(wb, 'filtered-data.xlsx');
  }
}
