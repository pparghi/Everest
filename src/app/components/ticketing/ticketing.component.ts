import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { TicketingService } from '../../services/ticketing.service';
import { DatePipe } from '@angular/common';
import { MatTableExporterDirective } from 'mat-table-exporter';
import * as XLSX from 'xlsx';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { ClientsService } from '../../services/clients.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

interface DataItem {
    Office: any;
    BankAcctName: any;
    RequestNo: any;
    RequestDate: any;
    RequestAmt: any;
    Status: any;
    RequestUser: any;
    Comments: any;
    ApproveDate: any;
    ApproveAmt: any;
    Response: any;
    Source: any;
    Balance: any;
    PastDue: any;
    Available: any;
    ClientKey: string;
    Debtor: string;
    Client: string;
    DebtorKey: number;    
    TotalCreditLimit: number;    
    IndivCreditLimit: number;    
    expandedDetail: { detail: string };
}

interface clientDataItem {
  Client: string;  
}

@Component({
  selector: 'app-ticketing',
  templateUrl: './ticketing.component.html',
  styleUrl: './ticketing.component.css',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TicketingComponent {  
    displayedColumns: string[] = ['expand', 'RequestNo', 'Debtor', 'Client', 'TotalCreditLimit', 'Status', 'IndivCreditLimit', 'RequestAmt', 'RequestUser', 'Office', 'Industry', 'BankAcctName', 'RequestDate', 'ApprovedDate', 'CreditType', 'Edit'];   
    clientDisplayedColumns: string[] = ['expand', 'Client', 'TotalAR', 'AgingOver60Days', '%pastdue', '#ofInvoicesDisputes', '#holdInvoices', '%concentration',  'CRM', 'Office', 'Analysis']; 
    statusListOptions = [
      { label: 'Pending', value: '0' },
      { label: 'Approved', value: '1' },
      { label: 'Declined', value: '2' },
      { label: 'Held', value: '3' }
    ];
    selectedValues: string[] = [];
    selectedValuesString: string = '';
    isLoading = true;
    dataSource = new MatTableDataSource<any>();
    firstRecord = []; // Get only the first record
    firstClientDataSource = new MatTableDataSource<any>();
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    clientExpandedElement: clientDataItem | null = null;
    math = Math;
    statusList = '1';
    requestDate: any;
    client = '';
    readonly dialog = inject(MatDialog);    
    readonly panelOpenState = signal(false);

    profile: any;
    user: any;    

    NavOptionMasterDebtor: any;
    NavAccessMasterDebtor: any;
    NavOptionClientRisk: any;
    NavAccessClientRisk: any;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTableExporterDirective) exporter!: MatTableExporterDirective;  
    @ViewChild('table', { static: false }) table!: ElementRef;

    NavOptionMasterDebtorUpdate: any;
    NavAccessMasterDebtorUpdate: any;
    NavOptionUpdateMasterDebtor: any;
    NavAccessUpdateMasterDebtor: any;
    NavOptionRiskMonitoring: any;
    NavAccessRiskMonitoring: any;
    NavOptionRiskMonitoringRestricted: any;
    NavAccessRiskMonitoringRestricted: any;

    constructor(private dataService: TicketingService,private clientService: ClientsService, private router: Router, private http: HttpClient, private loginService: LoginService, private datePipe: DatePipe) {         
      const today = new Date();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(today.getDate() - 1);
      this.requestDate = this.datePipe.transform(yesterdayDate, 'yyyy-MM-dd');      
    }
    ngOnInit(): void {
      this.selectedValues = ['0'];
      this.selectedValuesString = this.selectedValues.join(', ');
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

        this.isLoading = true;              
        const mail = btoa(this.profile.mail);             

        this.dataService.getData(this.selectedValuesString, this.requestDate, this.client).subscribe(response => {                
          this.isLoading = false;
          this.dataSource.data = response.data; 
          console.log(this.dataSource.data);                                             
        });
      });
    }

    onCheckboxChange(event: Event): void {
      const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedValues.push(checkbox.value);
    } else {
      const index = this.selectedValues.indexOf(checkbox.value);
      if (index > -1) {
        this.selectedValues.splice(index, 1);
      }
    }
    this.selectedValuesString = this.selectedValues.join(', ');    
      this.loadData();
    }

    isChecked(value: string): boolean {
      return this.selectedValues.includes(value);
    }

    onChangeRequestDate(event: Event){
      const selectElement = event.target as HTMLSelectElement;
      this.requestDate = selectElement.value   
      this.loadData();
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

      let clientkey = element.ClientKey.trim();  
        this.clientService.getClients(element.DebtorKey).subscribe(response => {                             
          this.firstClientDataSource.data = response.data;                    
          const index = this.firstClientDataSource.data.findIndex(c => c.ClientKey == clientkey);        
          if (index !== -1) {
            const [found] = response.data.splice(index, 1);               
            response.data.unshift(found); 
          }
          this.firstClientDataSource.data = response.data.slice(0, 1);
        });
    }

    clientToggleRow(element: clientDataItem){
      this.clientExpandedElement = this.clientExpandedElement === element ? null : element;
    }

    isClientExpanded(element: clientDataItem): boolean {
      return this.clientExpandedElement === element;
    }

    isClientExpansionDetailRow = (index: number, row: clientDataItem) => row.hasOwnProperty('clientExpandedDetail');

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

  onChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
               
      this.loadData();
  }

  openClientsInvoicesWindow(ClientKey: number, Client: string): void {
    // const url = this.router.serializeUrl(
    //   this.router.createUrlTree(['/invoices'], { queryParams: { ClientKey: ClientKey, DebtorKey: this.DebtorKey, Client: Client } })
    // );
    // window.open(url, '_blank');
  }

  edit(row: DataItem){
    this.http.get(GRAPH_ENDPOINT)
        .subscribe(profile => {
          this.profile = profile;          
          var userId = this.profile.mail.match(/^([^@]*)@/)[1];
          this.user = userId
          
          const dialogRef = this.dialog.open(DocumentDialogComponent, {         
            width: '1050px',       
            maxWidth: 'none',   
            height: 'auto',    
            panelClass: 'custom-dialog-container',                       
            data: {
             ClientKey: row.ClientKey,
             Client: row.Client,
             Office: row.Office,
             BankAcctName: row.BankAcctName,
             DebtorKey: row.DebtorKey,
             Debtor: row.Debtor,
             RequestNo: row.RequestNo,
             RequestDate: row.RequestDate,
             RequestAmt: row.RequestAmt,
             Status: row.Status,
             RequestUser: row.RequestUser,
             Comments: row.Comments,
             ApproveDate: row.ApproveDate,
             ApproveAmt: row.ApproveAmt,
             Response: row.Response,
             Source: row.Source,
             TotalCreditLimit: row.TotalCreditLimit,
             IndivCreditLimit: row.IndivCreditLimit,
             Balance: row.Balance,
             PastDue: row.PastDue,
             Available: row.Available,
             openTicketForm: 'editTicketForm',                 
           }
          });
          dialogRef.afterClosed().subscribe(result => {
              
          });
      });
  }

  addNew(){
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId
        
        const dialogRef = this.dialog.open(DocumentDialogComponent, {         
          width: '1050px',       
          maxWidth: 'none',   
          height: 'auto',    
          panelClass: 'custom-dialog-container',                       
          data: {
            addNew: 'addNewTicket',
            RequestUser: this.user
          }
        });
    });
  }

  exportTable() {        
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const filteredData = data.map((row: any[]) => {
      return row.slice(1, -1); 
    });

    const newWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(filteredData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, newWs, 'Sheet1');
    XLSX.writeFile(wb, 'filtered-data.xlsx');
  }
}
