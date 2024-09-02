import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { error } from 'jquery';
import Swal from 'sweetalert2';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

interface DataItem {
  Debtor: string;
  DebtorKey: number;
  DbDunsNo: string;
  Country: string;
  State: string;
  City: string;
  TotalCreditLimit: number;
  AIGLimit: string;
  Terms: string;
  NoBuyCode: number;  
  expandedDetail: { detail: string };
}

@Component({
  selector: 'app-master-debtors',
  templateUrl: './master-debtors.component.html',
  styleUrl: './master-debtors.component.css'
})

export class MasterDebtorsComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['expand', 'Debtor', 'DbDunsNo', 'Address', 'City', 'State','Country', 'DSO', 'TotalCreditLimit', 'AIGLimit', 'Terms', 'NoBuyCode', 'Edit'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    readonly dialog = inject(MatDialog);    

    profile: any;
    user: any;
    DebtoNoBuyDisputeList: any;
    DocumentsList: any;
    DocumentsCat: any;
    documentsFolder: any;
    oldTotalCreditLimit: any;
    oldNoBuyCode: any;
    editedElement: DataItem | null = null;
    DebtorContactsData: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;


    constructor(private dataService: DebtorsApiService, private router: Router, private http: HttpClient) {
      
    }
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
      this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
        this.isLoading = true;      
        const sort = this.sort ? this.sort.active : '';
        const order = this.sort ? this.sort.direction : '';
        const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
        const pageSize = this.paginator ? this.paginator.pageSize : 25;

        this.profile = profile;
        const mail = btoa(this.profile.mail);        
        
        this.dataService.getData(mail, page ,pageSize, this.filter, sort, order).subscribe(response => {                
          this.isLoading = false;
          this.dataSource.data = response.data;
          this.totalRecords = response.total;
          this.DebtoNoBuyDisputeList = response.noBuyDisputeList;                
        });
      });
    }

    openMembersWindow(DebtorKey: number, Debtor: string): void {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/members'], { queryParams: { DebtorKey: DebtorKey, Debtor: Debtor } })
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

    isEditModeOn(element: DataItem): boolean {
      return this.editedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

    getIcon(element: any): { icon: string, color: string } {
      if (this.math.round(element.DSO60) != 0 && this.math.round(element.DSO90) != 0) {        
        
        if (this.math.round(element.DSO60) == this.math.round(element.DSO90)) {
          return { icon: 'trending_up', color: 'green' };
        }
        if (this.math.round(element.DSO60) < this.math.round(element.DSO90)) {
          return { icon: 'trending_up', color: 'green' };
        }
        if ((this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 2)) ||  (this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 1))) {
          return { icon: 'trending_flat', color: 'orange' };
        }
        if (this.math.round(element.DSO60) > this.math.round(element.DSO90)) {
          return { icon: 'trending_down', color: 'red' };
        }
      }
      return { icon: '', color: 'grey' };
    }

    openDocumentsDialog(DebtorKey: number){
      
      this.dataService.getDebtorsDocuments(DebtorKey).subscribe(response => {                                
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
    
    startEdit(row: DataItem, index: number) {      
      this.oldTotalCreditLimit = row.TotalCreditLimit;
      this.oldNoBuyCode = row.NoBuyCode;
      this.editedElement = row;         
    }

    edit(row: DataItem){
      const dialogRef = this.dialog.open(DocumentDialogComponent, {                
        data: {
         DebtorKey: row.DebtorKey,
         openForm: 'editForm' 
       }
     });
     
     dialogRef.afterClosed().subscribe(result => {
         
     });
    }

    cancelEdit(row: DataItem) {
      row.NoBuyCode = this.oldNoBuyCode;
      this.editedElement = null;
    }

    saveRow(row: DataItem, index: number) {      
      this.http.get(GRAPH_ENDPOINT)
        .subscribe(profile => {
          this.profile = profile;          
          var userId = this.profile.mail.match(/^([^@]*)@/)[1];
          this.user = userId

          if (this.oldTotalCreditLimit != row.TotalCreditLimit) {
            const DebtorKey = row.DebtorKey;
            const TotalCreditLimit = row.TotalCreditLimit;
            const CredAppBy = this.user;            

            this.dataService.updateCreditLimit(DebtorKey, TotalCreditLimit, CredAppBy).subscribe(
              response => { 
                Swal.fire('Thank you!','Credit Limit Updated succesfully!', 'success');
                this.loadData();
              },
              error => {
                Swal.fire('Oops!','Credit Limit Update Failed!', 'error');
                this.loadData();             
              }              
            )}

          if (this.oldNoBuyCode != row.NoBuyCode) {
            const DebtorKey = row.DebtorKey;
            const NoBuyDisputeKey = row.NoBuyCode;
            const CredAppBy = this.user;                      
            
            this.dataService.updateNobuyCode(DebtorKey, NoBuyDisputeKey, CredAppBy).subscribe(
              response => { 
                Swal.fire('Thank you!','Account Status Updated succesfully!', 'success');
                this.loadData();
              },
              error => {
                Swal.fire('Oops!','Account Status Update Failed!', 'error');
                this.loadData();                                
              });
          }         
        });
    }

    openDebtorContactsDialog(DebtorKey: number){
      this.dataService.getDebtorsContacts(DebtorKey).subscribe(response => {                                
        this.DebtorContactsData = response.debtorContactsData;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, {                
           data: {
            DebtorKey: DebtorKey, 
            DebtorContactsData: this.DebtorContactsData,
          }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            
        });
    });
  }
   
}