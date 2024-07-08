import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberDebtorsService } from '../../services/member-debtors.service';

interface DataItem {
  Debtor: string;
  DbDunsNo: string;
  Country: string;
  State: string;
  City: string;
  TotalCreditLimit: string;
  AIGLimit: string;
  Terms: string;
  NoBuyCode: string;
  expandedDetail: { detail: string };
}


@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Debtor', 'DbDunsNo', 'Country', 'State', 'City', 'TotalCreditLimit', 'AIGLimit', 'Terms', 'NoBuyCode'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    DebtorKey!: number;
    displayDebtor: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

  constructor(private route: ActivatedRoute, private dataService: MemberDebtorsService, private router: Router){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const DebtorKey = +params['DebtorKey'];        
        this.DebtorKey = DebtorKey
        this.displayDebtor = params['Debtor']                
        this.loadMemberDebtorDetails(DebtorKey);
      });
    }

    loadMemberDebtorDetails(DebtorKey: number): void {            
      this.dataService.getMemberDebtors(DebtorKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }

    openClientsWindow(DebtorKey: number, Debtor: string): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/clients'], { queryParams: { DebtorKey: DebtorKey, Debtor: Debtor } })
      );
      window.open(url, '_blank');
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadMemberDebtorDetails(this.DebtorKey);
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
        this.loadMemberDebtorDetails(this.DebtorKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}
