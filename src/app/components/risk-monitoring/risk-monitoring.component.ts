import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { MatTableDataSource } from '@angular/material/table';

interface DataItem {
  Client: string,
  expandedDetail: { detail: string };
}

@Component({
  selector: 'app-risk-monitoring',
  templateUrl: './risk-monitoring.component.html',
  styleUrl: './risk-monitoring.component.css',
  providers: [DatePipe]
})

export class RiskMonitoringComponent implements OnInit {

  filter: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  isActive = '0';
  isDDSelect = 'N';
  isLoading = true;
  level = '';
  office = '';
  crm = '';
  isFuel = '';
  dataSource = new MatTableDataSource<any>();
  totalRecords = 0;
  displayedColumns: string[] = ['expand', 'Client', 'Level', 'CRM','A/R', 'NFE', 'Ineligibles', 'Reserves', 'Availability'];
  expandedElement: DataItem | null = null;
  isDDCreatedBy = '';

  clientGroupLevelList: any;
  clientCRMList: any;
  officeList: any;
  DDCreatedBy: any;  
  defaultDate!: string;
  formattedDate: any;
  dueDateFrom: any;
  dueDateTo: any;
  
  constructor(private dataService: RiskMonitoringService, private datePipe: DatePipe) { 
    let currentDate = new Date();
    let today = new Date();
    currentDate.setDate(currentDate.getDate() - 6);
    this.dueDateFrom = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
    this.dueDateTo = this.datePipe.transform(today, 'yyyy-MM-dd');
  }

  ngOnInit(): void {    
    this.loadData();      
    this.loadClientGroupLevelList();
    this.loadClientCRMList();
    this.loadOfficeList();
    this.loadDDCreatedByList(); 
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
    // this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
    //   this.profile = profile;
    //   this.loginService.getData(this.profile.mail).subscribe(response => {                                
    //     response.data.forEach((element: any) => {
    //       if (element.NavOption == 'Master Debtor') {            
    //         this.NavOptionMasterDebtor = element.NavOption;          
    //         this.NavAccessMasterDebtor = element.NavAccess;
    //       } else if (element.NavOption == 'Client Risk Page'){
    //         this.NavOptionClientRisk = element.NavOption;          
    //         this.NavAccessClientRisk = element.NavAccess;
    //       } else if (element.NavOption == 'Update Master Debtor'){
    //         this.NavOptionUpdateMasterDebtor = element.NavOption;          
    //         this.NavAccessUpdateMasterDebtor = element.NavAccess;
    //       } else {
    //         this.NavOptionMasterDebtor = '';
    //         this.NavAccessMasterDebtor = '';
    //         this.NavOptionClientRisk = '';
    //         this.NavAccessClientRisk = '';       
    //         this.NavOptionUpdateMasterDebtor = '';       
    //         this.NavAccessUpdateMasterDebtor = '';       
    //       }                                           
                      
    //     });
    //   }, error => {
    //     console.error('error--', error);
    //   });

      this.isLoading = true;      
      let sort = this.sort ? this.sort.active : '';
      let order = this.sort ? this.sort.direction : '';
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;

    //   const mail = btoa(this.profile.mail);        

    //   let filterByBalance = '';

    //   if (this.filterByBalance == 'Balance') {
    //     filterByBalance = 'balance';
    //   } 
      
      this.dataService.getData(page ,pageSize, sort, order, this.isActive, this.dueDateFrom, this.dueDateTo, this.isDDCreatedBy, this.filter, this.level, this.office, this.crm, this.isFuel).subscribe(response => {                
        this.isLoading = false;
      
        this.dataSource.data = response.data;
        response.data.forEach((element: any) => {
          const total = element.total;          
          this.totalRecords = total;                
        });                             
      });    
  }

  loadClientGroupLevelList() {
    this.dataService.getClientGroupLevelList().subscribe(response => {                                         
      this.clientGroupLevelList = response.clientGroupLevelList;
    });
  }

  loadClientCRMList() {
    this.dataService.getCRMList().subscribe(response => {                                         
      this.clientCRMList = response.CRMList;
    });
  }

  loadOfficeList() {
    this.dataService.getOfficeList().subscribe(response => {                                         
      this.officeList = response.officeList;
    });
  }

  loadDDCreatedByList() {
    this.dataService.getDDCreatedByList().subscribe(response => {                                         
      this.DDCreatedBy = response.DDCreatedBy;
    });
  }

  onChangeIsActive(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }
  
  onChangedueDateFrom(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.dueDateFrom = selectElement.value   
      this.loadData();
  }

  onChangedueDateTo(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.dueDateTo = selectElement.value   
      this.loadData();
  }

  onChangeDDSelect(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isDDSelect = selectElement.value   
      this.loadData();
  }

  onChangeDDCreatedBy(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isDDCreatedBy = selectElement.value   
      this.loadData();
  }

  onChangeLevel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.level = selectElement.value   
      this.loadData();
  }

  onChangeOffice(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.office = selectElement.value   
      this.loadData();
  }

  onChangeCRM(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.crm = selectElement.value   
      this.loadData();
  }

  onChangeFuel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isFuel = selectElement.value   
      this.loadData();
  }  

  toggleRow(element: DataItem): void {                        
    this.expandedElement = this.expandedElement === element ? null : element;       
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filter = filterValue.trim().toLowerCase(); 
    this.paginator.pageIndex = 0;
    this.loadData();     
  }

  isExpanded(element: DataItem): boolean {
    return this.expandedElement === element;
  }

  isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}
function strtotime(arg0: string): any {
  throw new Error('Function not implemented.');
}

