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
import { FilterService } from '../../services/filter.service';
import * as XLSX from 'xlsx';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { ClientsService } from '../../services/clients.service';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';

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
    ClientNo: string;
    CredRequestKey:string;
    CRMmail: string;
    MasterDebtor: string;
    MasterIndivCreditLimit: string;
    MasterTotalCreditLimit: string;
    Type: string;
    Terms: string;
    DateCreated: string;
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
    displayedColumns: string[] = ['expand', 'RequestNo', 'Debtor', 'Client', 'TotalCreditLimit', 'Status', 'IndivCreditLimit', 'RequestAmt', 'RequestUser', 'Office', 'Industry', 'BankAcctName', 'Age', 'ApproveDate', 'Source', 'Edit', 'Email'];   
    clientDisplayedColumns: string[] = ['expand', 'Client', 'TotalAR', 'AgingOver60Days', '%pastdue', '#ofInvoicesDisputes', '#holdInvoices', '%concentration',  'CRM', 'Office', 'Analysis']; 
    statusListOptions = [
      { label: 'Pending', value: '0' },
      { label: 'Approved', value: '1, 6, 7' },
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
    
    private autoReloadSub!: Subscription; // use for auto-reload subscription

    constructor(private dataService: TicketingService,private clientService: ClientsService, private router: Router, private http: HttpClient, private loginService: LoginService, private datePipe: DatePipe, private filterService: FilterService) {         
      const today = new Date();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(today.getDate() - 1);
      // yesterdayDate.setDate(today.getDate() - 110);
      this.requestDate = this.datePipe.transform(yesterdayDate, 'yyyy-MM-dd');      
    }
    ngOnInit(): void {
      this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId;
      });

      // load filter state from filter service
      const filterValues = this.filterService.getFilterState('ticketing');
      if (filterValues?.selectedValues) {
        this.selectedValues = filterValues.selectedValues;
      }
      else {
        this.selectedValues = ['0']; // Default value
      }
      if (filterValues?.requestDate) {
        this.requestDate = filterValues.requestDate;
      }

      this.selectedValuesString = this.selectedValues.join(', ');      
      this.loadData();     

      // Auto-reload every 30 seconds
      this.autoReloadSub = interval(30 * 1000).subscribe(() => this.loadData());
   
    }

    ngAfterViewInit(): void {            
      // if(this.paginator){
      //   this.paginator.page.subscribe(() => this.loadData());  
      // }  
      // if (this.sort) {
      //   this.sort.sortChange.subscribe(() => {  
      //     if(this.paginator){
      //       this.paginator.pageIndex = 0;  
      //     }
      //     this.loadData();  
      //   });  
      // }     
      
      // Set up client-side sorting
      if (this.sort) {
        this.dataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'TotalCreditLimit':
            case 'IndivCreditLimit':
            case 'RequestAmt':
              return Number(item[property]);
            case 'RequestDate':
              return new Date(item[property]).getTime();
            default:
              return item[property];
          }
        };

        this.dataSource.sort = this.sort;
      }

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }

      // Mark for check
      // this.cdr.detectChanges();
    }

    ngOnDestroy(): void {
      if (this.autoReloadSub) { // unsubscribe to prevent memory leaks when component is destroyed
        this.autoReloadSub.unsubscribe();
      }
    }

    loadData(): void {
      // console.log('loadData called');
      // this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      //   this.profile = profile;
      //   this.loginService.getData(this.profile.mail).subscribe(response => {                                
      //     response.data.forEach((element: any) => {
      //       if (element.NavOption == 'Master Debtor') {            
      //         this.NavOptionMasterDebtor = element.NavOption;          
      //         this.NavAccessMasterDebtor = element.NavAccess;
      //       } else if (element.NavOption == 'Client Risk Page'){
      //         this.NavOptionClientRisk = element.NavOption;          
      //         this.NavAccessClientRisk = element.NavAccess;
      //       } else if (element.NavOption == 'Update Master Debtor'){
      //         this.NavOptionUpdateMasterDebtor = element.NavOption;          
      //         this.NavAccessUpdateMasterDebtor = element.NavAccess;
      //       } else if (element.NavOption == 'Risk Monitoring'){
      //         this.NavOptionRiskMonitoring = element.NavOption;          
      //         this.NavAccessRiskMonitoring = element.NavAccess;
      //       } else if (element.NavOption == 'Risk Monitoring Restricted'){
      //         this.NavOptionRiskMonitoringRestricted = element.NavOption;          
      //         this.NavAccessRiskMonitoringRestricted = element.NavAccess;
      //       } else {
      //         this.NavOptionMasterDebtor = '';
      //         this.NavAccessMasterDebtor = '';
      //         this.NavOptionClientRisk = '';
      //         this.NavAccessClientRisk = '';       
      //         this.NavOptionUpdateMasterDebtor = '';       
      //         this.NavAccessUpdateMasterDebtor = ''; 
      //         this.NavOptionRiskMonitoring = '';
      //         this.NavAccessRiskMonitoring = '';
      //         this.NavOptionRiskMonitoringRestricted = '';
      //         this.NavAccessRiskMonitoringRestricted = '';
      //       }                                         
                        
      //     });
      //   }, error => {
      //     console.error('error--', error);
      //   });
             
      //   // const mail = btoa(this.profile.mail);             

      // });
      
      this.isLoading = true; 
      // stop load  data if there is row expended
      if (this.expandedElement !== null) {
        console.log('Row is expanded, no loading data');             
        this.isLoading = false;
        return;
      }

      this.dataService.getData(this.selectedValuesString, this.requestDate, this.client).subscribe(response => {                
        this.isLoading = false;
        this.dataSource.data = response.data;  
        // console.log('Data loaded:', this.dataSource.data);                                            
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
    this.filterService.setFilterState('ticketing', { "selectedValues": this.selectedValues });  
      this.loadData();
    }

    isChecked(value: string): boolean {
      return this.selectedValues.includes(value);
    }

    onChangeRequestDate(event: Event){
      const selectElement = event.target as HTMLSelectElement;
      this.requestDate = selectElement.value   
      this.filterService.setFilterState('ticketing', { "requestDate": this.requestDate }); 
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

  openClientsInvoicesWindow(ClientKey: number, Client: string) {
    let DebtorKey = this.expandedElement?.DebtorKey;
    
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/invoices'], { queryParams: { ClientKey: ClientKey, DebtorKey: DebtorKey, Client: Client } })
    );
    window.open(url, '_blank');
  }

  // the method to show info message using SweetAlert2
  showInfoMessage(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      Swal.fire({
        title: title,
        html: message,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        cancelButtonText: '  Close  ',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      }).then((result) => {
        if (result.isConfirmed) {
          resolve(true);  // User clicked Continue
        } else {
          resolve(false); // User clicked Close
        }
      });
    });
  }

  edit(row: DataItem) {
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId;
        console.log('row:', row);

        const dialogObj = {
          width: '1300px',
          maxWidth: 'none',
          height: 'auto',
          panelClass: 'custom-dialog-container',
          data: {
            row: row,
            ClientKey: row.ClientKey,
            Client: row.Client,
            ClientNo: row.ClientNo,
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
            CredRequestKey: row.CredRequestKey,
            userID: this.user,
            MasterDebtor:row.MasterDebtor,
            MasterIndivCreditLimit:row.MasterIndivCreditLimit,
            MasterTotalCreditLimit:row.MasterTotalCreditLimit,
            Type:row.Type,
            Terms: row.Terms,
            EstablishedDate: row.DateCreated,
          }
        }

        // before opening the dialog, check if the request is locked by another user
        // console.log('edit row.CredRequestKey:', row.CredRequestKey);
        this.dataService.actionToCreditRequest(parseInt(row.CredRequestKey), userId.toUpperCase(), 'L').subscribe(response => {
          // console.log('actionToCreditRequest response:', response);
          // Check if request is locked by another user
          if (response.result[0].Result.includes('Credit Request Ticket already locked by user')) {
            this.showInfoMessage(
              'Request Locked',
              response.result[0].Result
            ).then(continueAnyway => {
              if (continueAnyway) {
                // User clicked Continue - proceed with opening the dialog
                const dialogRef = this.dialog.open(DocumentDialogComponent, dialogObj);
              }
            });
          }
          else { // If not locked, proceed to open the dialog
            const dialogRef = this.dialog.open(DocumentDialogComponent, dialogObj);
            dialogRef.afterClosed().subscribe(result => { 
              // console.log('Dialog closed with result:', result);
              // After dialog is closed, unlock the request
              this.dataService.actionToCreditRequest(parseInt(row.CredRequestKey), userId.toUpperCase(), 'U').subscribe(response => {
                console.log('Request unlocked:', response);
              });
              // refresh the request list after dialog is closed
              console.log('Dialog closed, reloading data');
              this.loadData();
            });
          }

        });
      });
  }

  // function to click on Analytics icon and open the analytics dialog
  // openAnalyticsDialog(row: DataItem) {
  //   const dialogRef = this.dialog.open(TicketingAnalysisDialogComponent, {
  //     width: '1400px',
  //     maxWidth: 'none',
  //     height: 'auto',
  //     panelClass: 'custom-dialog-container',
  //     data: row
  //   });
  // }

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

  emailTo(row: DataItem) {
    // console.log('emailTo called');
    // console.log('row:', row);
    const subject = "Credit request #" + row.RequestNo;
    const body = "Debtor: " + row.Debtor + "\nClient: " + row.Client;
    const mailtoLink = `mailto:${row.CRMmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Create and trigger the mailto link
    const link = document.createElement('a');
    link.href = mailtoLink;
    document.body.appendChild(link); // Need to append to body first
    link.click();
    document.body.removeChild(link); // Clean up by removing the link
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
