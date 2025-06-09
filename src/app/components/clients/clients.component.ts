import { AfterViewInit, Component, Inject, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { DataTableDirective, DataTablesModule } from 'angular-datatables'; this dependency is not in use and cause conflict issue
import { Subject, filter } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { ClientsService } from '../../services/clients.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { columnGroupWidths } from '@swimlane/ngx-datatable';
import { get } from 'jquery';

interface DataItem {
  Client: string;
  Balance: number;
  Over60: number;
  PastDuePct: number;
  NoInvoicesDispute: number;
  NoInvoicesHold: number;
  Concentration: number;
  CRM: string;
  Office: string;
}

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})

export class ClientsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expand', 'Client', 'TotalAR', 'AgingOver60Days', '%pastdue', '#ofInvoicesDisputes', '#holdInvoices', '%concentration', 'CRM', 'Office', 'Analysis'];
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

  rawData: any[] = []; // Store the raw data for filtering
  checkboxValues: any[] = [true, false]; // Array to hold checkbox values

  constructor(private route: ActivatedRoute, private dataService: ClientsService, private router: Router) {
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

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch(property) {
        case 'TotalAR':
          return parseFloat(item.Balance) || 0;
        case 'AgingOver60Days':
          return parseFloat(item.Over60) || 0;
        case '%pastdue':
          return parseFloat(item.PastDuePct) || 0;
        case '#ofInvoicesDisputes':
          return parseInt(item.NoInvoicesDispute) || 0;
        case '#holdInvoices':
          return parseInt(item.NoInvoicesHold) || 0;
        case '%concentration':
          return parseFloat(item.Concentration) || 0;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = this.sort;
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
        this.dataSource.sort = this.sort; // Re-attach sort after new data
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
        this.dataSource.sort = this.sort; // Re-attach sort after new data
        this.rawData = response.data;
        this.filterRawData();
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
    return Math.ceil(this.totalRecords / pageSize);
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


  // filter raw data, save to dataSource.data
  filterRawData(): void {
    // iterate through rawData and pick rows base on filters
    let filteredData: any[] = this.rawData;

    if (this.checkboxValues[0]) {
      filteredData = filteredData.filter(item => {
        const hasBalance = parseFloat(item.Balance) > 0;
        return (hasBalance);
      });
    }
    if (this.checkboxValues[1]) {
      filteredData = filteredData.filter(item => {
        const isActive = (item.Inactive === '0');
        return (isActive);
      });
    }

    this.dataSource.data = filteredData;
  }
  // event handler for checkbox click
  onCheckboxClick(event: MatCheckboxChange): void {
    if (event.source.id === 'onlyShowBalances') {
      this.checkboxValues[0] = event.checked;
    }
    else if (event.source.id === 'onlyShowActives') {
      this.checkboxValues[1] = event.checked;
    }

    this.filterRawData();

  }
}
