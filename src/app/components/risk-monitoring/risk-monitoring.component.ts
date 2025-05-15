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
  isFuel = 'N';
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
    
    
  }

  ngOnInit(): void {    
    // this.filter = this.filterService.loadFromSessionStorage();
    // console.log(this.filter);

    // load filter state from filter service
    const filterValues = this.filterService.loadFromSessionStorage('risk-monitoring');
    if (filterValues) {
      // get filter values from filter state
      this.isActive = filterValues.isActive || '0';
      this.isDDSelect = filterValues.isDDSelect || 'N';
      this.isDDCreatedBy = filterValues.isDDCreatedBy || '';
      this.dueDateFromFront = filterValues.dueDateFromFront || '';
      this.dueDateToFront = filterValues.dueDateToFront || '';
      this.filter = filterValues.filter || '';
      this.level = filterValues.level || '';
      this.office = filterValues.office || '';
      this.crm = filterValues.crm || '';
      this.isFuel = filterValues.isFuel || 'N';
    }

    // set default date to recent 7 days
    let currentDate = new Date();
    let today = new Date();
    currentDate.setDate(currentDate.getDate() - 6);
    // set due dates back base on due dates front
    this.dueDateFromBack = this.dueDateFromFront || '';
    this.dueDateToBack = this.dueDateToFront || '';

    // set due date front to recent 7 days if at least one of both due date front from and to is empty
    if (!this.dueDateFromFront || !this.dueDateToFront) {
      this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
      this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
      // save due date front to filter service
      this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": this.dueDateFromFront });
      this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": this.dueDateToFront });
    }
    

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
      let sort = this.sort && this.sort.active ? this.sort.active : 'Client';            
      let order = this.sort && this.sort.direction ? this.sort.direction : 'ASC';  
      
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;  

      // empty due date from and to if isDDSelect is N
      if (this.isDDSelect == 'N') {
        this.dueDateFromBack = '';            
        this.dueDateToBack = '';
      }
      else {
        // set default date to recent 7 days
        let currentDate = new Date();
        let today = new Date();
        currentDate.setDate(currentDate.getDate() - 6);

        // set due date front to recent 7 days if at least one of both due date front from and to is empty
        if (this.dueDateFromFront == '' || this.dueDateToFront == '') {
          this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
          this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
          // save due date front to filter service
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": this.dueDateFromFront });
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": this.dueDateToFront });
        }
        // set back due date to front due date
        this.dueDateFromBack = this.dueDateFromFront;
        this.dueDateToBack = this.dueDateToFront;
      }

      this.riskService.getData(page, pageSize, sort, order, this.isActive, this.dueDateFromBack, this.dueDateToBack, this.isDDCreatedBy, this.filter, this.level, this.office, this.crm, this.isFuel).subscribe(response => {
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
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isActive": selectElement.value });
      this.isActive = selectElement.value;   
      this.loadData();
  }
  
  onChangedueDateFrom(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": selectElement.value });
      this.dueDateFromBack = selectElement.value;   
      this.dueDateFromFront = selectElement.value;   
      this.loadData();
  }

  onChangedueDateTo(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": selectElement.value });
      this.dueDateToBack = selectElement.value;   
      this.dueDateToFront = selectElement.value; 
      this.loadData();
  }

  onChangeDDSelect(event: Event){
    console.log("dueDateFromFront--", this.dueDateFromFront);
    console.log("dueDateToFront--", this.dueDateToFront);
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isDDSelect": selectElement.value });
      this.isDDSelect = selectElement.value;  
      let currentDate = new Date();
      let today = new Date();       
      if (this.isDDSelect == 'N') {
        // fetch rows with no date restriction
        this.dueDateFromBack = '';            
        this.dueDateToBack = '';
      } else {        
        // condition of at least one of both due date front from and to is empty 
        if (!this.dueDateFromFront || !this.dueDateToFront) {
          // reset due date to recent 7 days
          currentDate.setDate(currentDate.getDate() - 6);
          this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
          this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
          // save due date to filter service
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": this.dueDateFromFront });
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": this.dueDateToFront });
        }
        // condition of both due date from and to are not empty
        else {
          // fetch data with current date values
          this.dueDateFromBack = this.dueDateFromFront;
          this.dueDateToBack = this.dueDateToFront;
          // save due date to filter service
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": this.dueDateFromFront });
          this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": this.dueDateToFront });
        }
      }
      this.loadData();
  }

  onChangeDDCreatedBy(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isDDCreatedBy": selectElement.value });
      this.isDDCreatedBy = selectElement.value   
      this.loadData();
  }

  onChangeLevel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "level": selectElement.value });
      this.level = selectElement.value   
      this.loadData();
  }

  onChangeOffice(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "office": selectElement.value });
      this.office = selectElement.value   
      this.loadData();
  }

  onChangeCRM(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "crm": selectElement.value });
      this.crm = selectElement.value   
      this.loadData();
  }

  onChangeFuel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isFuel": selectElement.value });
      this.isFuel = selectElement.value   
      this.loadData();
  }  

  toggleRow(element: DataItem): void {                        
    this.expandedElement = this.expandedElement === element ? null : element;       
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "filter": filterValue.trim().toLowerCase() }); // save search value to filter service
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

  openDetailWindow(ClientKey: number, ARGrossBalance: number, Ineligible: number, NFE: number, Reserve: number, Availability: number, Level: string){
    this.dataService.setData('Level', Level);
    this.router.navigate(['/detail'], { queryParams: { ClientKey: ClientKey, ARGrossBalance: ARGrossBalance, Ineligible: Ineligible, NFE: NFE, Reserve: Reserve, Availability: Availability, Level: Level }  });    
  }

  isExpanded(element: DataItem): boolean {
    return this.expandedElement === element;
  }

  isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

  resetFilters(){
    this.isActive = '0';
    this.isDDSelect = 'N';
    this.isDDCreatedBy = '';
    this.filter = '';
    this.level = '';
    this.office = '';
    this.crm = '';
    this.isFuel = 'N';

    // reset filter state to default values
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isActive": this.isActive });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isDDSelect": this.isDDSelect });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isDDCreatedBy": this.isDDCreatedBy });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "level": this.level });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "office": this.office });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "crm": this.crm });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "filter": this.filter });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "isFuel": this.isFuel });

    // reset default date to recent 7 days
    let currentDate = new Date();
    let today = new Date();
    currentDate.setDate(currentDate.getDate() - 6);
    this.dueDateFromFront = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
    this.dueDateToFront = this.datePipe.transform(today, 'yyyy-MM-dd');
    // modify due date front and save to service
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateFromFront": this.dueDateFromFront });
    this.filterService.saveFiltersToSessionStorage('risk-monitoring', { "dueDateToFront": this.dueDateToFront });

    this.loadData();
  };

}

