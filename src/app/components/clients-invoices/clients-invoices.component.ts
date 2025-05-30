import { Component, Inject, OnInit, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { DataTableDirective, DataTablesModule } from 'angular-datatables'; this dependency is not in use and cause conflict issue
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { ClientsInvoicesService } from '../../services/clients-invoices.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';

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
  selector: 'app-clients-invoices',
  templateUrl: './clients-invoices.component.html',
  styleUrl: './clients-invoices.component.css'
})

export class ClientsInvoicesComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'InvDate', 'CloseDate', 'Debtor', 'InvNo', 'PurchOrd', 'Amt', 'Balance'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    ClientKey!: number;
    DebtorKey!: number;
    displayClient: any;
    readonly dialog = inject(MatDialog);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

  constructor(private route: ActivatedRoute, private dataService: ClientsInvoicesService, private router: Router){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {
        const ClientKey = +params['ClientKey'];
        this.ClientKey = ClientKey
        const DebtorKey = +params['DebtorKey'];
        this.DebtorKey = DebtorKey
        this.displayClient = params['Client']
        this.loadClientsinvoicesDetails(ClientKey, DebtorKey);
      });
    }

    loadClientsinvoicesDetails(ClientKey: number, DebtorKey: number): void {            
      this.dataService.getClientsInvoices(ClientKey, DebtorKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }
    
    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadClientsinvoicesDetails(this.ClientKey, this.DebtorKey);
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
        this.loadClientsinvoicesDetails(this.ClientKey, this.DebtorKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

    openInvoiceDetailNoteDialog(InvoiceKey: number){         
        const dialogRef = this.dialog.open(DocumentDialogComponent, {      
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',                    
           data: {
            InvoiceKey: InvoiceKey, 
            invoiceDetails: 'invoiceDetails',
          }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            
      });        
    }
}
