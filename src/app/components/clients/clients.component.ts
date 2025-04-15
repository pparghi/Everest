import { Component, Inject, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject, filter } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { ClientsService } from '../../services/clients.service';

interface DataItem {
  Client: string;  
}

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})

export class ClientsComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Client', 'TotalAR', 'AgingOver60Days', '%pastdue', '#ofInvoicesDisputes', '#holdInvoices', '%concentration',  'CRM', 'Office', 'Analysis'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    @Input() DebtorKey!: number;
    @Input() ClientKey!: string;
    displayDebtor: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    currentPath: string = '';

  constructor(private route: ActivatedRoute, private dataService: ClientsService, private router: Router){
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentPath = this.router.url.split('/').slice(1).join('/');
    });
  }
    
    ngOnInit(): void {
      this.currentPath = this.router.url.split('/').slice(1).join('/');
      this.route.queryParams.subscribe(params => {
        const DebtorKey = +params['DebtorKey'];
        this.DebtorKey = DebtorKey
        const ClientKey = params['ClientKey'];
        this.ClientKey = params['ClientKey'];        
        
        this.displayDebtor = params['Debtor']
        this.loadClientsDetails(DebtorKey);
      });
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['DebtorKey']) {
        this.loadClientsDetails(this.DebtorKey);
      }
    }

    loadClientsDetails(DebtorKey: number): void {               
      if (this.ClientKey) {
        let clientkey = this.ClientKey.trim();  
        this.dataService.getClients(DebtorKey).subscribe(response => {                             
          this.dataSource.data = response.data;                    
          const index = this.dataSource.data.findIndex(c => c.ClientKey == clientkey);        
          if (index !== -1) {
            const [found] = response.data.splice(index, 1);               
            response.data.unshift(found); 
          }
          this.dataSource.data = response.data.slice(1);
        });
      } else {
        this.dataService.getClients(DebtorKey).subscribe(response => {                             
          this.dataSource.data = response.data;
        });
      }                
    }

    openClientsInvoicesWindow(ClientKey: number, Client: string): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/invoices'], { queryParams: { ClientKey: ClientKey, DebtorKey: this.DebtorKey, Client: Client } })
      );
      window.open(url, '_blank');
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadClientsDetails(this.DebtorKey);
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
        this.loadClientsDetails(this.DebtorKey);
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
