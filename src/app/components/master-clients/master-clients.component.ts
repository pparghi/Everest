import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MasterClientsService } from '../../services/master-clients.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';

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
  Available: number;
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
    displayedColumns: string[] = ['expand', 'Client', 'Age0to30', 'Age31to60', 'Age61to90', 'Age91to120', 'Age121to150', 'Ineligible', 'Balance', 'Reserve', 'NFE', 'extra'];
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

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    readonly dialog = inject(MatDialog); 

    memberClientKey!: number;
  accountStatusDilution!: string;
  accountStatusIneligible!: string;
  accountStatusAvailable!: string;
  filterByBalance!: string;
  clientGroupLevelList: any;
  filterByGroup!: string;

    constructor(private dataService: MasterClientsService,private router: Router) {}
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
      const sort = this.sort ? this.sort.active : '';
      const order = this.sort ? this.sort.direction : '';
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;
      let filterByBalance = '';
      let filterByGroup = this.filterByGroup ? this.filterByGroup : '%';

      if (this.filterByBalance == 'Balance') {
        filterByBalance = 'balance';
      } 

      this.dataService.getData(page ,pageSize, this.filter, sort, order, filterByBalance, filterByGroup).subscribe(response => {                                
        this.isLoading = false;
        this.dataSource.data = response.data;
        this.totalRecords = response.total;        
        this.clientGroupLevelList = response.clientGroupLevelList;
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
          this.filterByBalance = selectElement.value          
          this.loadData();
      }

      onChangeGroup(event: Event){
        const selectElement = event.target as HTMLSelectElement;
          this.filterByGroup = selectElement.value;
          this.loadData();
      }
   
}