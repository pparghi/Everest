import { Component, Input, SimpleChanges, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { MemberMasterDebtorService } from '../../services/member-master-debtor.service';

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
  selector: 'app-member-master-debtor',
  templateUrl: './member-master-debtor.component.html',
  styleUrl: './member-master-debtor.component.css'
})

export class MemberMasterDebtorComponent {
  displayedColumns: string[] = ['Debtor', 'Currency', 'DbDunsNo', 'Balance',  'TotalCreditLimit', 'AIG Coverage', '%Utilized', '%% Verified', 'NOA', 'Payments'];
  isLoading = true;
  dataSource = new MatTableDataSource<any>([]);
  totalRecords = 0;
  filter: string = '';
  specificPage: number = 1;
  expandedElement: DataItem | null = null;
  math = Math;
  @Input() DebtorKey!: number;
  displayDebtor: any;

  DocumentsList: any;
  DocumentsCat: any;
  documentsFolder: any;

  readonly dialog = inject(MatDialog);    

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  DebtorContactsData: any;
  @Input() MasterClientKey!: number;
  DebtorPaymentsData: any;
  MiscDataList: any;

  constructor(private route: ActivatedRoute, private clientDebtorService: ClientsDebtorsService, private masterDebtorService: DebtorsApiService,  private dataService: MemberMasterDebtorService, private router: Router){}
    
    ngOnInit(): void {      
      this.loadMemberMasterDebtorDetails(this.DebtorKey);
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['DebtorKey']) {
        this.loadMemberMasterDebtorDetails(this.DebtorKey);
      }
      if (changes['MasterClientKey']) {
        this.loadMemberMasterDebtorDetails(this.MasterClientKey);
      }
    }

    loadMemberMasterDebtorDetails(DebtorKey: number): void {            
      this.dataService.getDebtorsMasterDebtor(DebtorKey, this.MasterClientKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }

    openDocumentsDialog(DebtorKey: number){      
      this.masterDebtorService.getDebtorsDocuments(DebtorKey).subscribe(response => {                                
        this.DocumentsList = response.documentsList;
        this.DocumentsCat = response.DocumentsCat;
        this.documentsFolder = response.DocumentsFolder;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, {                
          data: {
            DebtorKey: DebtorKey, 
            documentsList: this.DocumentsList,
            documentCategory: this.DocumentsCat,
            documentsFolder: this.documentsFolder
          }
        });        
        dialogRef.afterClosed().subscribe(result => {            
        });
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
      this.loadMemberMasterDebtorDetails(this.DebtorKey);
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
        this.loadMemberMasterDebtorDetails(this.DebtorKey);
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
      this.clientDebtorService.getDebtorsPayments(DebtorKey, this.MasterClientKey).subscribe(response => {                                
        this.DebtorPaymentsData = response.debtorPaymentsData;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, {                
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

  miscData(DebtorKey: any){
    this.clientDebtorService.getMiscData(DebtorKey, this.MasterClientKey).subscribe(response => {                                
      this.MiscDataList = response.MiscDataList;
      
      const dialogRef = this.dialog.open(DocumentDialogComponent, {                
         data: {
          DebtorKey: DebtorKey, 
          ClientKey: this.MasterClientKey,
          MiscDataList: this.MiscDataList,
        }
      });
      
      dialogRef.afterClosed().subscribe(result => {
          
      });
  });
  }
}

