import { Component, Inject, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { DataTableDirective, DataTablesModule } from 'angular-datatables'; this dependency is not in use and cause conflict issue
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
  selector: 'app-member-clients',
  templateUrl: './member-clients.component.html',
  styleUrl: './member-clients.component.css'
})
export class MemberClientsComponent implements OnInit {
  // displayedColumns: string[] = ['expandDebtor','Client', 'CreditLimit', 'CreditUtilization','dsc'];
  displayedColumns: string[] = ['expandDebtor','Client','dsc'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    displayDebtor: any;

    @Input() MasterClientKey!: number;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

  constructor(private route: ActivatedRoute, private dataService: MemberClientsService, private router: Router){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const MasterClientKey = +params['MasterClientKey'];        
        this.MasterClientKey = MasterClientKey            
        this.loadMemberClientDetails(this.MasterClientKey);
      });
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['MasterClientKey']) {
        this.loadMemberClientDetails(this.MasterClientKey);
      }
    }

    loadMemberClientDetails(MasterClientKey: number): void {            
      this.dataService.getMemberClients(MasterClientKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }

    openClientsDebtorWindow(DebtorKey: number): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/clients'], { queryParams: { DebtorKey: DebtorKey } })
      );
      window.open(url, '_blank');
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadMemberClientDetails(this.MasterClientKey);
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
        this.loadMemberClientDetails(this.MasterClientKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

    // function to show correct Month names base on current date, last, last-2, last-3 months
    // input values how many months back from current date
    getMonthNameByDiffMonths(monthIndex: number): string {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const currentDate = new Date();
      const month = (currentDate.getMonth() - monthIndex + 12) % 12; // Adjust for negative indices
      return monthNames[month];
    }
}

