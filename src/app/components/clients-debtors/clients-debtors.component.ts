import { Component, Inject, Input, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberClientsService } from '../../services/member-clients.service';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
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
  AgeOver180: string;  
  Balance: string;  
  expandedDetail: { detail: string };
}


@Component({
  selector: 'app-clients-debtors',
  templateUrl: './clients-debtors.component.html',
  styleUrl: './clients-debtors.component.css'
})
export class ClientsDebtorsComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Debtor', 'Currency', 'Balance', 'DebtorLimit', 'RelationshipLimit', 'Concentration', 'AIG Coverage', 'Dilution', 'Ineligible', 'Term','%% Verified', 'NOA', 'Payments', 'extra'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    MemberClientKey!: number;
    @Input() MasterClientKey!: number;
    displayDebtor: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    
  DebtorPaymentsData: any;
  readonly dialog = inject(MatDialog);

  constructor(private route: ActivatedRoute, private dataService: ClientsDebtorsService , private router: Router){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const MemberClientKey = +params['MemberClientKey'];        
        this.MemberClientKey = MemberClientKey
        this.displayDebtor = params['Debtor']                
        this.loadClientDebtorsDetails(this.MasterClientKey);
      });
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['MasterClientKey']) {
        this.loadClientDebtorsDetails(this.MasterClientKey);
      }
    }

    loadClientDebtorsDetails(MasterClientKey: number): void {            
      this.dataService.getClientsDebtors(MasterClientKey).subscribe(response => {                      
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
      this.loadClientDebtorsDetails(this.MemberClientKey);
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
        this.loadClientDebtorsDetails(this.MemberClientKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

    payments(DebtorKey: any, Debtor: any){
      this.dataService.getDebtorsPayments(DebtorKey, this.MasterClientKey).subscribe(response => {                                
        this.DebtorPaymentsData = response.debtorPaymentsData;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, { 
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',               
           data: {
            DebtorKey: DebtorKey,
            Debtor: Debtor, 
            ClientKey: this.MasterClientKey,
            DebtorPaymentsData: this.DebtorPaymentsData,
          }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            
        });
    });
  }

  noa(DebtorKey: any){
    const dialogRef = this.dialog.open(DocumentDialogComponent, {   
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',             
      data: {
       DebtorKey: DebtorKey, 
       noa: 'noa',
     }
   });
   
   dialogRef.afterClosed().subscribe(result => {
       
   });
  }

}
