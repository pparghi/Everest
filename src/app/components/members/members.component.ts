import { Component, Inject, Input, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { DataTableDirective, DataTablesModule } from 'angular-datatables'; this dependency is not in use and cause conflict issue
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
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { DocumentsReportsService } from '../../services/documents-reports.service';
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
  PctUtilized: number;  
  PastDuePct: number;  
  Addr1: string;
  Addr2: string;
  Phone1: number;
  Phone2: number;
  Email: string;
  MotorCarrNo: number;
  CredExpireDate: string;
  RateDate: string;
  IndivCreditLimit: number;
  CredNote: string;
  Notes: string;
  Warning: string;
  expandedDetail: { detail: string };
}


@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Debtor', 'Balance', '%Utilized', 'PastDue%', 'DSO', 'TotalCreditLimit', 'IndivCreditLimit', 'AIGLimit', 'Terms', 'CalcRateCode', 'Edit', 'extra'];
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
    user: any;

    readonly dialog = inject(MatDialog);    

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
  DebtorContactsData: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionMasterDebtor: any;
  NavAccessMasterDebtor: any;
  NavOptionClientRisk: any;
  NavAccessClientRisk: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;

  constructor(private route: ActivatedRoute, private masterDebtorService: DebtorsApiService,  private http: HttpClient,  private dataService: MemberDebtorsService, private router: Router,private loginService: LoginService, private documentsReportsService: DocumentsReportsService){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const DebtorKey = +params['DebtorKey'];        
        this.DebtorKey = DebtorKey
        this.displayDebtor = params['Debtor']                
        // this.loadMemberDebtorDetails(DebtorKey);
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
              if (element.NavOption == 'Master Debtor') {            
                this.NavOptionMasterDebtor = element.NavOption;          
                this.NavAccessMasterDebtor = element.NavAccess;
              } else if (element.NavOption == 'Client Risk Page'){
                this.NavOptionClientRisk = element.NavOption;          
                this.NavAccessClientRisk = element.NavAccess;
              } else if (element.NavOption == 'Update Master Debtor'){
                this.NavOptionUpdateMasterDebtor = element.NavOption;          
                this.NavAccessUpdateMasterDebtor = element.NavAccess;
              } else if (element.NavOption == 'Risk Monitoring'){
                this.NavOptionRiskMonitoring = element.NavOption;          
                this.NavAccessRiskMonitoring = element.NavAccess;
              } else if (element.NavOption == 'Risk Monitoring Restricted'){
                this.NavOptionRiskMonitoringRestricted = element.NavOption;          
                this.NavAccessRiskMonitoringRestricted = element.NavAccess;
              } else {
                this.NavOptionMasterDebtor = '';
                this.NavAccessMasterDebtor = '';
                this.NavOptionClientRisk = '';
                this.NavAccessClientRisk = '';       
                this.NavOptionUpdateMasterDebtor = '';       
                this.NavAccessUpdateMasterDebtor = ''; 
                this.NavOptionRiskMonitoring = '';
                this.NavAccessRiskMonitoring = '';
                this.NavOptionRiskMonitoringRestricted = '';
                this.NavAccessRiskMonitoringRestricted = '';
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

  getIcon(element: any): { icon: string, color: string } {
    if (this.math.round(element.DSO60) != 0 && this.math.round(element.DSO90) != 0) {        
      
      if (this.math.round(element.DSO60) == this.math.round(element.DSO90)) {
        return { icon: 'trending_up', color: 'red' };
      }
      if (this.math.round(element.DSO60) < this.math.round(element.DSO90)) {
        return { icon: 'trending_up', color: 'red' };
      }
      if ((this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 2)) ||  (this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 1))) {
        return { icon: 'trending_flat', color: 'orange' };
      }
      if (this.math.round(element.DSO60) > this.math.round(element.DSO90)) {
        return { icon: 'trending_down', color: 'green' };
      }
    }
    return { icon: '', color: 'grey' };
  }

  openDSODialog(DSO30: number, DSO60: number, DSO90:number, Debtor: string){
    const roundThousandsPipe = new RoundThousandsPipe();
    var DSO_30 = roundThousandsPipe.transform(DSO30);
    var DSO_60 = roundThousandsPipe.transform(DSO60);
    var DSO_90 = roundThousandsPipe.transform(DSO90);      

    const dialogRef = this.dialog.open(DocumentDialogComponent, {      
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                    
       data: {
        DSO_30: DSO_30,
        DSO_60: DSO_60,
        DSO_90: DSO_90,
        Debtor: Debtor
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        
    });
    
  }

  edit(row: DataItem){    
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId
      
    // this.dataService.setEditData({ 
    //   DebtorKey: row.DebtorKey, 
    //   Debtor: row.Debtor, 
    //   Duns: row.DbDunsNo, 
    //   Addr1: row.Addr1, 
    //   Addr2: row.Addr2, 
    //   City: row.City, 
    //   State: row.State, 
    //   Phone1: row.Phone1, 
    //   Phone2: row.Phone2, 
    //   PctUtilized: row.PctUtilized, 
    //   PastDuePct: row.PastDuePct, 
    //   TotalCreditLimit: row.TotalCreditLimit, 
    //   AIGLimit: row.AIGLimit, 
    //   Terms: row.Terms, 
    //   openForm: 'editForm' 
    // });
    // this.router.navigate(['/edit-master-debtor']);
    const dialogRef = this.dialog.open(DocumentDialogComponent, {         
      width: '1050px',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                       
      data: {
       DebtorKey: row.DebtorKey,
       Debtor: row.Debtor,
       Duns: row.DbDunsNo,
       Addr1: row.Addr1,
       Addr2: row.Addr2,
       City: row.City,
       State: row.State,
       Phone1: row.Phone1,
       Phone2: row.Phone2,
       PctUtilized: row.PctUtilized,
       PastDuePct: row.PastDuePct,
       TotalCreditLimit: row.TotalCreditLimit,
       IndivCreditLimit: row.IndivCreditLimit,
       AIGLimit: row.AIGLimit,
       Terms: row.Terms,
       MotorCarrNo: row.MotorCarrNo,
       Email: row.Email,
       RateDate: row.RateDate,
       CredExpireDate: row.CredExpireDate,
       openForm: 'editForm',
       CredAppBy: this.user,
       CredNote: row.CredNote,
       Notes: row.Notes,
       Warning: row.Warning
     }
    });
    dialogRef.afterClosed().subscribe(result => {
        
    });
  });
  }

  openChecqueSearchDialog(DebtorKey: number){
    const dialogRef = this.dialog.open(DocumentDialogComponent, {      
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                    
       data: {
        DebtorKey: DebtorKey, 
        openChequeSearchForm: 'chequeSearchForm',
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        
  });
  }

  openDebtorAuditDialog(DebtorKey: number){   
    const dialogRef = this.dialog.open(DocumentDialogComponent, {      
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                    
       data: {
        DebtorKey: DebtorKey, 
        debtorAudit: 'debtorAudit',
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        
  });    
}

openDebtorStatementsDialog(DebtorKey: number){   
  const dialogRef = this.dialog.open(DocumentDialogComponent, {      
    width: 'auto',       
    maxWidth: 'none',   
    height: 'auto',    
    panelClass: 'custom-dialog-container',                    
     data: {
      DebtorKey: DebtorKey, 
      debtorStatements: 'debtorStatements',
    }
  });
  
  dialogRef.afterClosed().subscribe(result => {
      
});    
}

  // event of clicking report button 
  getReportLink (element: DataItem){
    // console.log("element--",element);
    this.documentsReportsService.callAnsoniaAPI(element?.MotorCarrNo.toString()??'',element.Debtor??'',element.Addr1??'',element.City??'',element.State??'',element.Country??'').subscribe((response: { url: string }) => { 
      // console.log('response--', response);
      window.open(response.url, "_blank");
    });
  } 

}
