import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { Router } from '@angular/router';

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
  selector: 'app-master-debtors',
  templateUrl: './master-debtors.component.html',
  styleUrl: './master-debtors.component.css'
})

export class MasterDebtorsComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['expand', 'Debtor', 'DbDunsNo', 'Country', 'State', 'City', 'TotalCreditLimit', 'DSO' ,'AIGLimit', 'Terms', 'NoBuyCode'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private dataService: DebtorsApiService, private router: Router) {}
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

    openMembersWindow(DebtorKey: number): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/members'], { queryParams: { DebtorKey: DebtorKey } })
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

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}