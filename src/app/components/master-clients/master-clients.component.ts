import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MasterClientsService } from '../../services/master-clients.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../services/login.service';
import { FilterService } from '../../services/filter.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

interface DataItem {
  Client: string;
  Age0to30: string;  
  Age31to60: string;  
  Age61to90: string;  
  Age91to120: string;  
  Age121to150: string;  
  Age151to180: string;   
  Balance: string;  
  Dillution30: number;
  Ineligible: number;
  IneligiblePct: number;
  OverAdvancedPct: number;
  Available: number;
  Warning: string;
  expandedDetail: { detail: string };
}
interface MemberDataItem {
  Client: string;     
  Balance: string;  
  DebtorexpandedDetail: { detail: string };
}

@Component({
  selector: 'app-master-clients',
  templateUrl: './master-clients.component.html',
  styleUrl: './master-clients.component.css'
})

export class MasterClientsComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['expand', 'Client', 'Warning', 'CreditLimit', 'ContractualLimit', 'Age0to30', 'Age31to60', 'Age61to90', 'Age91to120', 'Age121to150', 'Ineligible', 'IneligiblePct', 'OverAdvancedPct', 'Balance', 'Reserve', 'NFE', 'extra'];
    displayedMemberColumns: string[] = ['expandDebtor','Client', 'CreditLimit', 'CreditUtilization','dsc'];
    memberClient: string[] = ['member1', 'member2', 'member3'];

    isLoading = true;
    isLoadingMember = false;
    dataSource = new MatTableDataSource<any>([]);
    memberDataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    memberExpandedElement: MemberDataItem | null = null;
    math = Math;
    MasterClientKey!: number;    

    NavOptionMasterDebtor: any;
    NavAccessMasterDebtor: any;
    NavOptionClientRisk: any;
    NavAccessClientRisk: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    readonly dialog = inject(MatDialog); 

    memberClientKey!: number;
  accountStatusDilution!: string;
  accountStatusIneligible!: string;
  accountStatusAvailable!: string;
  filterByBalance: string = 'Balance';
  clientGroupLevelList: any;
  clientGroupList: any;
  clientCRMList: any;
  clientGroupValueList: any;
  filterByGroupLevel!: string;
  filterByGroup:any = '%';
  filterByGroupValue = '%';
  profile: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;
  filterByCRM = '%';

    constructor(private dataService: MasterClientsService, private router: Router, private http: HttpClient, private loginService: LoginService, private filterService: FilterService) {}
    ngOnInit(): void {  
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
      //       } else if (element.NavOption == 'Risk Monitoring'){
      //         this.NavOptionRiskMonitoring = element.NavOption;          
      //         this.NavAccessRiskMonitoring = element.NavAccess;
      //       } else if (element.NavOption == 'Risk Monitoring Restricted'){
      //         this.NavOptionRiskMonitoringRestricted = element.NavOption;          
      //         this.NavAccessRiskMonitoringRestricted = element.NavAccess;
      //       } else {
      //         this.NavOptionMasterDebtor = '';
      //         this.NavAccessMasterDebtor = '';
      //         this.NavOptionClientRisk = '';
      //         this.NavAccessClientRisk = '';       
      //         this.NavOptionUpdateMasterDebtor = '';       
      //         this.NavAccessUpdateMasterDebtor = ''; 
      //         this.NavOptionRiskMonitoring = '';
      //         this.NavAccessRiskMonitoring = '';
      //         this.NavOptionRiskMonitoringRestricted = '';
      //         this.NavAccessRiskMonitoringRestricted = '';
      //       }                                  
                        
      //     });
      //   }, error => {
      //     console.error('error--', error);
      //   });    
        
      // });    
      
      
      // load filter state from filter service
      const filterValues = this.filterService.getFilterState('master-clients');
      if (filterValues){
        // get filter values from filter state
        this.filter = filterValues.filter || '';
        this.filterByBalance = filterValues.filterByBalance || 'Balance';
        this.filterByGroup = filterValues.filterByGroup || '';
        if (this.filterByGroup) {
          this.loadClientGroupValueList(); // load client group value list based on filterByGroup
        }
        this.filterByGroupValue = filterValues.filterByGroupValue || '';
        this.filterByCRM = filterValues.filterByCRM || '';
        // set html filter state
        if (this.filter){
          document.getElementsByName('searchBar')[0].setAttribute('value', this.filter);
        }
      }

      // set html filterByBalance states
      if (this.filterByBalance == 'Balance') {
        document.getElementsByName('filterByBalance')[1].setAttribute('checked', 'true');
      }
      else {
        document.getElementsByName('filterByBalance')[0].setAttribute('checked', 'true');
      }

      this.loadData();
      this.loadClientGroupLevelList();
      this.loadClientGroupList();
    }

    loadClientGroupLevelList() {
      this.dataService.getClientGroupLevelList().subscribe(response => {                                         
        this.clientGroupLevelList = response.clientGroupLevelList;
      });
    }

    loadClientGroupList() {
      this.dataService.getClientGroupList().subscribe(response => {                      
        this.clientGroupList = response.clientGroupList;
        this.clientCRMList = response.clientCRMList;
      });
    }

    loadClientGroupValueList() {
      this.dataService.getClientGroupValueList(this.filterByGroup).subscribe(response => {                      
        this.clientGroupValueList = response.clientGroupValueList;
      });
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
      this.isLoading = true;        
      let sort = this.sort ? this.sort.active : 'Balance';
      let order = this.sort ? this.sort.direction : 'DESC';
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;
      let filterByBalance = '';
      let filterByGroup = this.filterByGroup ? this.filterByGroup : '%';
      let filterByGroupValue = this.filterByGroupValue ? this.filterByGroupValue : '%';
      let filterByCRM = this.filterByCRM ? this.filterByCRM : '%';

      if (this.filterByBalance == 'Balance') {
        filterByBalance = 'balance';
      } 
      // console.log('sort--', sort, ' order--', order, ' filterByBalance--', filterByBalance);
      this.dataService.getData(page ,pageSize, this.filter, sort, order, filterByBalance, filterByGroup, filterByGroupValue, filterByCRM).subscribe(response => {                                                              
        this.isLoading = false;
        this.dataSource.data = response.data;

        response.data.forEach((element: any) => {
          const total = element.total;          
          this.totalRecords = total;    
        });
        
      });
    }

    // loadMemberClientDetails(MasterClientKey: number): void {                       
    //   this.memberDataService.getMemberClients(MasterClientKey).subscribe(response => {    
    //     this.isLoadingMember = false;
    //     this.memberDataSource.data = response.data;           
    //     response.data.forEach((element: any) => {  
    //       this.memberClientKey = element.ClientKey;          
    //     });              
    //     this.MasterClientKey = MasterClientKey         
    //   });
    // }

    openDebtorsWindow(ClientKey: number): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/client-debtor'], { queryParams: { MemberClientKey: ClientKey } })
      );
      window.open(url, '_blank');
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filterService.setFilterState('master-clients', { "filter": filterValue.trim().toLowerCase() }); // save search value to filter service
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
    toggleRowDebtor(memberElement: MemberDataItem): void {                        
      this.memberExpandedElement = this.memberExpandedElement === memberElement ? null : memberElement;      
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isDebtorExpanded(memberElement: MemberDataItem): boolean {
      return this.memberExpandedElement === memberElement;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');    
    isDebtorExpansionDetailRow = (index: number, row: MemberDataItem) => row.hasOwnProperty('DebtorexpandedDetail');    

    getDilutionIcon(element: DataItem){
      if (element.Dillution30 <= 1.5) { 
        return 'green';
      } else if (element.Dillution30 >= 1.51 && element.Dillution30 <= 3) {
        return 'yellow';
      } else if (element.Dillution30 > 3) {
        return 'red';
      } else {
        return '';
      }  
    }     

    getIneligibleIcon(element: DataItem){
      if (element.IneligiblePct <= 4.9) { 
        return 'green';
      } else if (element.IneligiblePct >= 5 && element.IneligiblePct <= 10) {
        return 'yellow';
      } else if (element.IneligiblePct > 10) {
        return 'red';
      } else {
        return '';
      }            
    }

    getAvailableIcon(element: DataItem){
      if (element.Available >= 0) { 
        return 'green';
      } else if (element.Available < 0 && element.Available <= -2) {
        return 'yellow';
      } else if (element.Available > -2) {
        return 'red';
      } else {
        return '';
      }            
    }     
    
    getFinalColor(element: DataItem){
      if (this.getDilutionIcon(element) == 'red') {
        return 'DilutionRed';
      }else if (this.getIneligibleIcon(element) == 'red') {
        return 'IneligibleRed';
      }else if (this.getAvailableIcon(element) == 'red') {
        return 'AvailableRed';
      }else if (this.getDilutionIcon(element) == 'yellow') {
        return 'DilutionYellow';
      }else if (this.getIneligibleIcon(element) == 'yellow') {
        return 'IneligibleYellow';
      }else if (this.getAvailableIcon(element) == 'yellow') {
        return 'AvailableYellow';
      }else if (this.getDilutionIcon(element) == 'green') {
        return 'DilutionGreen';
      }else if (this.getIneligibleIcon(element) == 'green') {
        return 'IneligibleGreen';
      }else if (this.getAvailableIcon(element) == 'green') {
        return 'AvailableGreen';
      } else {
        return '';
      }
    }

    showAccountStatusDetail(element: DataItem){    
        const dialogRef = this.dialog.open(DocumentDialogComponent, {      
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',                    
            data: {              
              ClientAccountStatus: 'ClientAccountStatus',
              Client : element.Client,
              Dilution: element.Dillution30,
              Ineligibles: element.IneligiblePct,
              Availability: element.Available  
          }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            
        });
      }

      onChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.filterService.setFilterState('master-clients', { "filterByBalance": selectElement.value }); // save filterByBalance value to filter service
          this.filterByBalance = selectElement.value          
          this.loadData();
      }

      onChangeGroupLevel(event: Event){
        const selectElement = event.target as HTMLSelectElement;
          this.filterByGroupLevel = selectElement.value;
          this.loadData();
      }    

      onChangeGroup(event: Event){
        const selectElement = event.target as HTMLSelectElement;          
        this.filterService.setFilterState('master-clients', { "filterByGroup": selectElement.value }); // save filterByGroup value to filter service
          this.filterByGroup = selectElement.value;
          this.loadClientGroupValueList();
      }

      onChangeGroupValue(event: Event){
        const selectElement = event.target as HTMLSelectElement;          
        this.filterService.setFilterState('master-clients', { "filterByGroupValue": selectElement.value }); // save filterByGroupValue value to filter service
          this.filterByGroupValue = selectElement.value;          
          this.loadData();
      }

      onChangeCRM(event: Event){
        const selectElement = event.target as HTMLSelectElement;          
        this.filterService.setFilterState('master-clients', { "filterByCRM": selectElement.value }); // save filterByCRM value to filter service
          this.filterByCRM = selectElement.value;          
          this.loadData();
      }

      showWarningNote(element: DataItem){    
        const dialogRef = this.dialog.open(DocumentDialogComponent, {      
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',                    
            data: {
              showWarningNote: 'showWarningNote',              
              Warning: element.Warning,  
              Client: element.Client
          }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            
        });
      }
   
}