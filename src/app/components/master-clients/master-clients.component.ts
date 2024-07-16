import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MasterClientsService } from '../../services/master-clients.service';
import { Router } from '@angular/router';
import { MemberClientsService } from '../../services/member-clients.service';

interface DataItem {
  Client: string;
  Age0to30: string;  
  Age31to60: string;  
  Age61to90: string;  
  Age91to120: string;  
  Age121to150: string;  
  Age151to180: string;  
  AgeOver180: string;  
  Balance: string;  
  expandedDetail: { detail: string };
}

@Component({
  selector: 'app-master-clients',
  templateUrl: './master-clients.component.html',
  styleUrl: './master-clients.component.css'
})

export class MasterClientsComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['expand', 'Client', 'Age0to30', 'Age31to60', 'Age61to90', 'Age91to120', 'Age121to150', 'Age151to180', 'AgeOver180', 'Balance', 'Reserve', 'NFE'];
    displayedMemberColumns: string[] = ['Client', 'CreditLimit', 'CreditUtilization','test'];
    memberClient: string[] = ['member1', 'member2', 'member3'];

    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    memberDataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private dataService: MasterClientsService,private memberDataService: MemberClientsService, private router: Router) {}
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

      this.dataService.getData(page ,pageSize, this.filter, sort, order).subscribe(response => {                
        this.isLoading = false;
        this.dataSource.data = response.data;
        this.totalRecords = response.total;        
        
      });
    }

    loadMemberClientDetails(MasterClientKey: number): void {                       
      this.memberDataService.getMemberClients(MasterClientKey).subscribe(response => {        
        this.memberDataSource.data = response.data;                
      });
    }

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

    toggleRow(element: DataItem, MasterClientKey: number): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;
      this.loadMemberClientDetails(MasterClientKey);
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');    
   
}