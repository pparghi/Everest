import { Component, Inject, Input, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoginService } from '../../services/login.service';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

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
  displayedColumns: string[] = ['expand', 'Debtor', 'DbDunsNo', 'Address', 'City', 'State', '%Utilized', 'PastDue%', 'TotalCreditLimit', 'Terms'];
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
    profile: any;

    readonly dialog = inject(MatDialog);    

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
  DebtorContactsData: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;

  constructor(private route: ActivatedRoute, private masterDebtorService: DebtorsApiService,  private http: HttpClient,  private dataService: MemberDebtorsService, private router: Router,private loginService: LoginService){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const DebtorKey = +params['DebtorKey'];        
        this.DebtorKey = DebtorKey
        this.displayDebtor = params['Debtor']                
        this.loadMemberDebtorDetails(DebtorKey);
      });
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['DebtorKey']) {
        this.loadMemberDebtorDetails(this.DebtorKey);
      }
    }

    loadMemberDebtorDetails(DebtorKey: number): void {        
        this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
          this.profile = profile;
          this.loginService.getData(this.profile.mail).subscribe(response => {                                
            response.data.forEach((element: any) => {
              if (element.NavOption == 'Update Master Debtor'){
                this.NavOptionUpdateMasterDebtor = element.NavOption;          
                this.NavAccessUpdateMasterDebtor = element.NavAccess;
              } else {  
                this.NavOptionUpdateMasterDebtor = '';       
                this.NavAccessUpdateMasterDebtor = '';       
              }                                           
                          
            });
          }, error => {
            console.error('error--', error);
          });    
        this.dataService.getMemberDebtors(DebtorKey).subscribe(response => {        
          this.dataSource.data = response.data;
        });
      })
    }

    openDocumentsDialog(DebtorKey: number){      
      this.masterDebtorService.getDebtorsDocuments(DebtorKey).subscribe(response => {                                
        this.DocumentsList = response.documentsList;
        this.DocumentsCat = response.DocumentsCat;
        this.documentsFolder = response.DocumentsFolder;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, { 
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',               
           data: {
            DebtorKey: DebtorKey, 
            documentsList: this.DocumentsList,
            documentCategory: this.DocumentsCat,
            documentsFolder: this.documentsFolder,
            NavOptionUpdateMasterDebtor: this.NavOptionUpdateMasterDebtor,
            NavAccessUpdateMasterDebtor: this.NavAccessUpdateMasterDebtor
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

    openDebtorContactsDialog(DebtorKey: number){
      this.masterDebtorService.getDebtorsContacts(DebtorKey).subscribe(response => {                                
        this.DebtorContactsData = response.debtorContactsData;
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, {     
          width: 'auto',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',            
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
