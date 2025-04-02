import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginService } from '../../services/login.service';
import { DataService } from '../../services/data.service';
import { FilterService } from '../../services/filter.service';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

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
  specificPage: number = 1;
  isActive = '0';
  isDDSelect = 'N';
  isLoading = true;
  level = '';
  office = '';
  crm = '';
  isFuel = '';
  dataSource = new MatTableDataSource<any>();
  totalRecords = 0;
  displayedColumns: string[] = ['expand', 'Client', 'NoteDueDate', 'Level', 'CRM','A/R', 'NFE', 'Ineligibles', 'Reserves', 'Availability'];
  expandedElement: DataItem | null = null;
  isDDCreatedBy = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  clientGroupLevelList: any;
  clientCRMList: any;
  officeList: any;
  DDCreatedBy: any;  
  defaultDate!: string;
  formattedDate: any;
  dueDateFromFront: any;
  dueDateToFront: any;
  dueDateFromBack: any;
  dueDateToBack: any;  
  profile: any; 
  NavOptionMasterDebtor: any;
  NavAccessMasterDebtor: any;
  NavAccessClientRisk: any;
  NavOptionClientRisk: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;
  bgcolor = '';
  NotesNoDate = false;
  NotesFutureDate = false;
  NotesPastDue = false
  
  constructor(private riskService: RiskMonitoringService, private http: HttpClient, private datePipe: DatePipe, private router: Router, private loginService: LoginService, private dataService: DataService, private filterService: FilterService) { 
    let currentDate = new Date();
    let today = new Date();
    if (this.isDDSelect == 'N') {      
      currentDate.setDate(currentDate.getDate() - 6);
      this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');            
      this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
      this.dueDateFromBack = '';            
      this.dueDateToBack = '';
    } else {
      this.dueDateFromBack = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
      this.dueDateFromBack = this.datePipe.transform(today, 'yyyy-MM-dd');
    }
    
  }

  ngOnInit(): void {    
    // this.filter = this.filterService.getFilterState();
    // console.log(this.filter);
    
    this.loadData();      
    this.loadClientGroupLevelList();
    this.loadClientCRMList();
    this.loadOfficeList();
    this.loadDDCreatedByList();     
  }

  getRowClass(row: any) {
    return {
      'NotesDueDate': row.NotesDueDate != '0',
      'NotesNoDate': row.NotesNoDate != '0',
      'NotesFutureDate': row.NotesFutureDate != '0',
      'NotesPastDue': row.NotesPastDue != '0'
    };
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
      let sort = this.sort && this.sort.active ? this.sort.active : 'NoteDueDate';            
      let order = this.sort && this.sort.direction ? this.sort.direction : 'DESC';
      console.log(sort);
      
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;  
      
      this.riskService.getData(page ,pageSize, sort, order, this.isActive, this.dueDateFromBack, this.dueDateToBack, this.isDDCreatedBy, this.filter, this.level, this.office, this.crm, this.isFuel).subscribe(response => {                
        this.isLoading = false;
      
        this.dataSource.data = response.data;
        response.data.forEach((element: any) => {
          const total = element.Total;          
          this.totalRecords = total;                
        });                             
      });    
    });
  }

  loadClientGroupLevelList() {
    this.riskService.getClientGroupLevelList().subscribe(response => {                                         
      this.clientGroupLevelList = response.clientGroupLevelList;
    });
  }

  loadClientCRMList() {
    this.riskService.getCRMList().subscribe(response => {                                         
      this.clientCRMList = response.CRMList;
    });
  }

  loadOfficeList() {
    this.riskService.getOfficeList().subscribe(response => {                                         
      this.officeList = response.officeList;
    });
  }

  loadDDCreatedByList() {
    this.riskService.getDDCreatedByList().subscribe(response => {                                         
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
      this.dueDateToBack = selectElement.value   
      this.loadData();
  }

  onChangedueDateTo(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.dueDateToBack = selectElement.value   
      this.loadData();
  }

  onChangeDDSelect(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isDDSelect = selectElement.value  
      let currentDate = new Date();
      let today = new Date();       
      if (this.isDDSelect == 'N') {
        currentDate.setDate(currentDate.getDate() - 6);
        this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');        
        this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
        this.dueDateFromBack = '';            
        this.dueDateToBack = '';
      } else {        
        currentDate.setDate(currentDate.getDate() - 6);
        this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');            
        this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
        this.dueDateFromBack = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
        this.dueDateToBack = this.datePipe.transform(today, 'yyyy-MM-dd');
      }
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
    // this.filterService.setFilterState(this.filter);
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

  openDetailWindow(ClientKey: number, ARGrossBalance: number, Ineligible: number, NFE: number, Reserve: number, Availability: number, Level: string){
    this.dataService.setData('Level', Level);
    this.router.navigate(['/detail'], { queryParams: { ClientKey: ClientKey, ARGrossBalance: ARGrossBalance, Ineligible: Ineligible, NFE: NFE, Reserve: Reserve, Availability: Availability, Level: Level }  });    
  }

  isExpanded(element: DataItem): boolean {
    return this.expandedElement === element;
  }

  isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}

