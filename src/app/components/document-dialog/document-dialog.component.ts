import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DebtorsApiService } from '../../services/debtors-api.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { error, event } from 'jquery';
import { count, map } from 'rxjs/operators';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { LoginService } from '../../services/login.service';
import { ClientsInvoicesService } from '../../services/clients-invoices.service';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AddressService } from '../../services/address.service';
import { MatTableExporterDirective } from 'mat-table-exporter';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { TicketingService } from '../../services/ticketing.service';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from 'chart.js';
import { DecimalPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WarningSnackbarComponent, SuccessSnackbarComponent, ErrorSnackbarComponent } from '../custom-snackbars/custom-snackbars';
import { MatSort, MatSortModule } from '@angular/material/sort';


Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Title,
  Tooltip
);
// import imageCompression from 'browser-image-compression';
declare var pca: any;

interface Response {
  payments: Array<any>;
}

interface DebtorDataItem {
  expandedDetail: { detail: string };
}

interface TrendVerticalData {
  Period: string;
  [key: string]: any;  // Allow any additional properties
}


@Component({
  selector: 'app-document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrl: './document-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe]
})
export class DocumentDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  link: any;
  documentDescr: any;
  documentCategory: any;
  documentFolder: any;
  file!: File;
  path: any;
  ContactName: any;
  ContactEmail: any;
  ContactNo: any;
  debtor: any;

  contactColumns: string[] = ['name', 'email', 'contact_no'];
  paymentsColumns: string[] = ['CheckNo', 'ClientName', 'DebtorName', 'PostDate', 'Buy', 'PayAmt'];
  auditColumns: string[] = ['TimeStamp', 'UserKey', 'Field', 'Was', 'Is'];
  statementsColumns: string[] = ['Debtor', 'Client', 'PO/LOAD', 'Invoice#', 'InvDate', 'Age', 'Currency', 'Amt', 'Balance', 'expand'];
  paymentColumns: string[] = ['date', 'check#', 'amount'];
  miscDataColumns: string[] = ['element', 'value'];
  detailNotesColumns: string[] = ['Date', 'UserName', 'contact', 'Method', 'Promise', 'Note'];
  contactDataSource = new MatTableDataSource<any>([]);
  auditDataSource = new MatTableDataSource<any>([]);
  statementsDataSource = new MatTableDataSource<any>([]);
  paymentDataSource = new MatTableDataSource<any>([]);
  MiscDataListDataSource = new MatTableDataSource<any>([]);
  ratesDataSource = new MatTableDataSource<any>([]);
  paymentsDataSource = new MatTableDataSource<any>([]);
  detailNotesDataSource = new MatTableDataSource<any>([]);

  jpgDataUrl: string | ArrayBuffer | null = null;

  noaStatus = [
    { value: 'Not Sent', label: 'Not Sent' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ]

  editForm!: FormGroup;
  editTicketForm!: FormGroup;
  chequeSearchForm!: FormGroup;
  addNewTicketForm!: FormGroup;
  changedNoaStatus!: string;
  payment_images!: { fullname: string; basename: any; }[];
  fileExtension: any;
  addressSuggestions: any[] = [];
  selectedValue!: string;
  Payment30: any;
  Payment60: any;
  Payment90: any;
  Payment120: any;
  isChequeSearchLoading: boolean = true;
  isChequeSearchEmpty: boolean = false;
  currentMonth!: string;
  lastThreeMonths: string[] = [];
  lastThreeMonths30!: string;
  lastThreeMonths60!: string;
  lastThreeMonths90!: string;

  query: string = '';
  suggestions: any[] = [];
  addr2suggestions: any[] = [];
  private searchSubject = new Subject<string>();
  readonly panelOpenState = signal(false);

  expandedElement: DebtorDataItem | null = null;

  focusedInputOfAdress: string = 'address1';

  // #region ticketing variables
  @ViewChild(MatTableExporterDirective) exporter!: MatTableExporterDirective; 
  displayedColumns: string[] = ['YearMonth', 'Purchases', 'PurchasesAvg', 'PurchasesNo', 'PaiTodZero', 'Recoursed', 'AvgWeightedDays'];
  displayedColumnsVertical: string[] = [];
  ticketingTrendDataSource = new MatTableDataSource<any>();
  ticketingTrendDataVertical: TrendVerticalData[] = []; // this is used for displaying trend data in vertical format
  trendDabtorName: string = '';
  trendClientName: string = '';
  trendDebtorKey: number = 0;
  trendClientNo: string = '';
  trendPeriodChar: string = 'M';
  actionList: any[] = [];
  @ViewChild(MatSort) sort!: MatSort;
  AgingTabSelectedDebtor: string = '';
  AgingTabDebtorList: string[] = [];
  originalStatementsData: any[] = [];
  // charts
  chart: any;
  @ViewChild('trendBarChart') chartCanvas!: ElementRef;
  trendColumn: string = 'Purchases';
  // For Status filter
  AgingTabStatusList: string[] = [];
  AgingTabSelectedStatuses: string[] = [];
  // for Aging tab
  totalBalance: string = 'N/A';
  balanceShown: string = 'N/A';
  totalQuantityShown: string = 'N/A';
  // get debtor details from child component trend tab
  debtorDetails: any = {};

  private _snackBar = inject(MatSnackBar); // used for snackbar notifications


  constructor(private fb: FormBuilder, private http: HttpClient, private clientService: ClientsDebtorsService, private clientInvoiceService: ClientsInvoicesService, private loginService: LoginService, private dataService: DebtorsApiService, private dialogRef: MatDialogRef<DocumentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private addressService: AddressService, private documentsReportsService: DocumentsReportsService, private ticketingService: TicketingService, private _decimalPipe: DecimalPipe, private cdr: ChangeDetectorRef) {
    if (data.openChequeSearchForm) {
      this.chequeSearchForm = this.fb.group({
        CheckNo: [''],
        Amt: [''],
        PostDateStart: [''],
        PostDateEnd: [''],
        LastPayments: ['']
      });
      this.onChequeSearch();
    } else if (data.openForm) {

      if (data.Phone1.length == 11 || data.Phone2.length == 11) {
        var Phone1 = data.Phone1.substring(1);
        var Phone2 = data.Phone2.substring(1);
      } else {
        Phone1 = data.Phone1;
        Phone2 = data.Phone2;
      }

      const roundThousandsPipe = new RoundThousandsPipe();
      var creditLimit = roundThousandsPipe.transform(data.TotalCreditLimit);
      var AIGLimit = roundThousandsPipe.transform(data.AIGLimit);

      this.editForm = this.fb.group({
        DebtorKey: [data.DebtorKey || ''],
        Debtor: [data.Debtor || ''],
        Duns: [data.Duns || ''],
        Addr1: [data.Addr1 || ''],
        Addr2: [data.Addr2 || ''],
        City: [data.City || ''],
        State: [data.State || ''],
        Phone1: [Phone1 || ''],
        Phone2: [Phone2 || ''],
        TotalCreditLimit: [creditLimit || ''],
        AIGLimit: [AIGLimit || ''],
        Terms: [data.Terms || ''],
        Email: [data.Email || ''],
        MotorCarrNo: [data.MotorCarrNo || ''],
        CredExpireMos: [data.CredExpireMos || ''],
        RateDate: [data?.RateDate ? data?.RateDate.split(' ')[0] : ''],
        Notes: [data.Notes || ''],
        CredNote: [data.CredNote || ''],
        IndivCreditLimit: [data.IndivCreditLimit || ''],
        CredAppBy: [data.CredAppBy || ''],
        FFNo: [data.FFNo || ''],
        CVOR: [data.Cvor || ''],
        USDOT: [data.USDot || ''],
        Warning: [data.Warning || ''],
        DotNo: [data.DotNo || '']
      })

      this.debtor = data.Debtor
    } else if (data.openTicketForm) {
      // #region ticketing page
      console.log('ticketing data--', data);

      // request tab
      const roundThousandsPipe = new RoundThousandsPipe();
      var creditLimit = roundThousandsPipe.transform(data.TotalCreditLimit);
      var AIGLimit = roundThousandsPipe.transform(data.AIGLimit);

      this.editTicketForm = this.fb.group({
        ClientKey: [data.ClientKey || ''],
        Client: [data.Client || ''],
        Office: [data.Office || ''],
        BankAcctName: [data.BankAcctName || ''],
        DebtorKey: [data.DebtorKey || ''],
        Debtor: [data.Debtor || ''],
        RequestNo: [data.RequestNo || ''],
        RequestDate: [data.RequestDate || ''],
        RequestAmt: [this.formatCurrency(data.RequestAmt) || ''],
        Status: [data.Status || ''],
        RequestUser: [data.RequestUser || ''],
        Comments: [data.Comments || ''],
        ApproveDate: [data.ApproveDate || ''],
        ApproveAmt: [this.formatCurrency(data.ApproveAmt) || '', Validators.required], // Required
        Response: [data.Response || ''],
        Source: [data.Source || ''],
        TotalCreditLimit: [this.formatCurrency(data.TotalCreditLimit) || ''],
        IndivCreditLimit: [this.formatCurrency(data.IndivCreditLimit) || ''],
        Balance: [data.Balance || ''],
        PastDue: [data.PastDue || ''],
        Available: [data.Available || ''],
        CredRequestKey: [data.CredRequestKey || ''],
        PONumber: '',
        ShipDate: '',
        EstablishedDate: this.convertDateToMMDDYYYY(data.EstablishedDate) || '',
        Terms: data.Terms || '',
        ExpiresDate: this.addMonths(1),
        Action: ['', Validators.required], // Required
        NewLimit: ['0', Validators.required], // Required
        ExpiresInMonths: ['1', Validators.required], // Required
        FreeTextInput: '',
        SendDecisionToClient: false,
        ChangeMaster: data.Type === "Non-Grouped"?false:true,
        MasterDebtor:data.MasterDebtor,
        MasterIndivCreditLimit: this.formatCurrency(data.MasterIndivCreditLimit) || '',
        MasterTotalCreditLimit: this.formatCurrency(data.MasterTotalCreditLimit) || '',
        Type:data.Type,
        CredAppBy: data.row.CredAppBy || '',
        RateDate: '',
      })

      this.debtor = data.Debtor
      this.getCreditRequestStatusList();

      this.debtorDetails = null;

      // trend tab
      this.trendDabtorName = data.Debtor;
      this.trendClientName = data.Client;
      this.trendDebtorKey = data.DebtorKey;
      this.trendClientNo = data.ClientNo;
      this.loadTrendDialogData(data.DebtorKey, data.ClientNo, this.trendPeriodChar);

      // aging tab
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {
        console.log("Aging Tab Debtor Contacts Response:", response);
        // Store original data
        this.originalStatementsData = response.debtorStatementsDetails;
        // Set data source
        this.statementsDataSource.data = response.debtorStatementsDetails;
        // Extract unique debtor names for filter dropdown
        this.extractUniqueDebtors(response.debtorStatementsDetails);
        // Extract unique status values for filter dropdown
        this.extractUniqueStatuses(response.debtorStatementsDetails);
        // calculate default total numbers
        let tempTotal = 0;
        for (let myBalance of response.debtorStatementsDetails) {
          tempTotal += Number(myBalance.Balance);
        }
        this.totalBalance = this.formatCurrency(tempTotal);
        this.updateTotalShown(); // update totalShown and totalQuantityShown
      });

      // endregion
    } else if (data.documentsList) {
      this.data.documentsList.forEach((document: { FileName: string; Path: any; DocHdrKey: { toString: () => string; }; Link: string; }, index: any) => {
        const filename = document.FileName.split('.');
        const x = filename.length - 1;
        const link = `${document.Path}\\${document.DocHdrKey.toString().padStart(6, '0')}.${filename[x]}`;
        document.Link = btoa(link);
        this.link = document.Link
      });

      this.data.documentsFolder.forEach((docFolder: any) => {
        this.path = docFolder.Path
      });
    } else if (data.DebtorPaymentsData) {
      this.clientService.getDebtorsPayments(data.DebtorKey, data.ClientKey).subscribe(response => {
        this.paymentDataSource.data = response.debtorPaymentsData;
      });
    } else if (data.MiscDataList) {
      this.clientService.getMiscData(data.DebtorKey, data.ClientKey).subscribe(response => {
        this.MiscDataListDataSource.data = response.MiscDataList;
      });
    } else if (data.exchangeRatesByMonth) {
      this.loginService.getExchangeRatesByMonth().subscribe(response => {
        this.ratesDataSource.data = response.exchangeRatesByMonth;
      });
    } else if (data.debtorAudit) {
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {
        this.auditDataSource.data = response.debtorAudit;
      });
    } else if (data.debtorStatements) {
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {
        this.statementsDataSource.data = response.debtorStatementsDetails;
      });
    } else if (data.chequeSearch) {

    } else if (data.addNew) {
      this.addNewTicketForm = this.fb.group({
        ClientKey: [data.ClientKey || ''],
        DebtorKey: [data.DebtorKey || ''],
        RequestAmt: [data.RequestAmt || ''],
        RequestUser: [data.RequestUser || ''],
        Comments: [data.Comments || ''],
        SourceCode: [data.SourceCode || ''],
        ReqContactKey: [data.ReqContactKey || '']
      })
    } else if (data.invoiceDetails) {
      this.clientInvoiceService.getClientsInvoiceDetailNotes(data.InvoiceKey).subscribe(response => {
        this.detailNotesDataSource.data = response.data;
      });
    } else {
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {
        this.contactDataSource.data = response.debtorContactsData;
      });
    }

    this.searchSubject.pipe(debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        console.log("Fetching suggestsions for : ", query);
        return this.addressService.getAddressSuggestions(query);
      })
    ).subscribe({
      next: (data) => {
        console.log("API Response:", data);
        if (data.Items) {
          // condition of focusing on address 1
          if (this.focusedInputOfAdress == "address1") {
            this.suggestions = data.Items.map((item: any) => ({
              text: item.Text,
              description: item.Description
            }));
          } else {
            this.addr2suggestions = data.Items.map((item: any) => ({
              text: item.Text,
              description: item.Description
            }));
          }
        } else {
          this.suggestions = [];
          // this.addr2suggestions = [];
        }
      },
      error: (error) => {
        console.error('Error fetching address suggestions: ', error);
      }
    });
  }

  onQueryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    console.log("query changed:", selectElement.value);
    this.query = selectElement.value

    this.focusedInputOfAdress = "address1";
    if (this.query.length > 2) {
      console.log("lendth > called");
      this.searchSubject.next(this.query);
    } else {
      console.log("else part to clear suggestions");
      this.suggestions = []; // Clear suggestions when query is too short
    }
  }

  onAddr2QueryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    console.log("address 2 query changed:", selectElement.value);
    this.query = selectElement.value

    this.focusedInputOfAdress = "address2";
    if (this.query.length > 2) {
      console.log("lendth > called");
      this.searchSubject.next(this.query);
    } else {
      console.log("else part to clear suggestions");
      this.addr2suggestions = []; // Clear suggestions when query is too short
    }
  }

  selectSuggestion(suggestion: any) {
    this.editForm.get('Addr1')?.setValue(suggestion.text)
    this.suggestions = [];
  }
  selectAddr2Suggestion(addr2suggestion: any) {
    this.editForm.get('Addr2')?.setValue(addr2suggestion.text)
    this.addr2suggestions = [];
  }

  ngOnInit(): void {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    this.currentMonth = monthNames[now.getMonth()];

    for (let i = 1; i <= 3; i++) {
      const pastMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      this.lastThreeMonths.push(monthNames[pastMonth.getMonth()]);
    }
    this.lastThreeMonths30 = this.lastThreeMonths[2];
    this.lastThreeMonths60 = this.lastThreeMonths[1];
    this.lastThreeMonths90 = this.lastThreeMonths[0];

    // const script = document.createElement('script');
    // script.src = 'https://ws1.postescanada-canadapost.ca/js/addresscomplete-2.50.min.js';
    // script.onload = () => {      
    //   const ac = new (<any>window).pca.AddressComplete(document.getElementById('Addr2'), {
    //     key: 'dy85-mj85-wx29-nn39',
    //     country: 'CAN'
    //   });
    // };
    // console.log(script);
    // document.body.appendChild(script);
  }

  ngAfterViewInit(): void {
    this.statementsDataSource.sort = this.sort;

    // if (typeof pca !== 'undefined') {
    //   pca.setup({
    //     key: 'dy85-mj85-wx29-nn39',
    //     culture: 'en-CA'
    //   });
    // } else {
    //   console.error('AddressComplete script not loaded');
    // }


    // const inputElement = document.getElementById('Addr1');
    // if (!inputElement) {
    //   console.error('Input element not found.');
    //   return;
    // }

    try {
      // Create an instance of pca.AddressComplete
      // const addressComplete = new pca.AddressComplete(inputElement, {
      //   key: 'dy85-mj85-wx29-nn39', // Your API key
      //   culture: 'en-CA', // Set the culture to Canada
      //   country: 'CAN', // Restrict to Canada
      // });
      const addressComplete = new pca.AddressComplete();

      // Listen for the address selection event for Addr1
      // console.log('addressComplete.controls:', addressComplete.controls);
      addressComplete.controls[4].listen('populate', (address: any) => {
        // console.log('Selected Address:', address);
        this.editForm.get('Addr1')?.setValue(address.Line1);
      });

      // Listen for the address selection event for Addr2
      addressComplete.controls[3].listen('populate', (address: any) => {
        // console.log('Selected Address:', address);
        this.editForm.get('Addr2')?.setValue(address.Line1);
      });

    } catch (error) {
      console.error('Error initializing AddressComplete:', error);
    }

  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // onAddressInput(event: any) {
  //   const query = event.target.value;
  //   this.addressCompleteService.getSuggestions(query).then((data: any) => {
  //     this.addressSuggestions = data;
  //   });
  // }

  openFile() {
    // let url = atob(this.link);       
    // window.open("https://everest.revinc.com:4202/storage/uploads/");
    let url = 'https://login.baron.finance/iris/public/common/show_pdf.php?pdf=' + this.link;
    window.open(url);
    return false;
  }

  onFilechange(event: any) {
    this.file = event.target.files[0]
  }


  onSubmit() {
    const DebtorKey = this.data.DebtorKey;
    const Descr = this.documentDescr;
    const DocCatKey = this.documentCategory;
    const DocFolderPath = this.path;
    const file = this.file;

    const formData = new FormData();
    formData.append('DebtorKey', DebtorKey);
    formData.append('Descr', Descr);
    formData.append('DocCatKey', DocCatKey);
    formData.append('DocFolderPath', DocFolderPath);
    formData.append('file', this.file);

    this.http.post('https://everest.revinc.com:4202/api/debtorMasterAddDocument', formData)
      .subscribe(response => {
        console.log('file uploaded', response);
      }, error => {
        console.error('Upload failed', error);
      });
  }

  onEdit() {
    const confirmed = window.confirm('Are you sure you want to update the debtor details?'); // Add confirmation popup
    if (confirmed && this.editForm.valid) {
      // console.log(this.editForm.value);

      const formData = new FormData();
      formData.append('DebtorKey', this.editForm.value.DebtorKey);
      formData.append('Debtor', this.editForm.value.Debtor);
      formData.append('Duns', this.editForm.value.Duns);
      formData.append('Addr1', this.editForm.value.Addr1);
      formData.append('Addr2', this.editForm.value.Addr2);
      formData.append('Phone1', this.editForm.value.Phone1);
      formData.append('Phone2', this.editForm.value.Phone2);
      formData.append('City', this.editForm.value.City);
      formData.append('State', this.editForm.value.State);
      formData.append('TotalCreditLimit', this.editForm.value.TotalCreditLimit);
      formData.append('IndivCreditLimit', this.editForm.value.IndivCreditLimit);
      formData.append('AIGLimit', this.editForm.value.AIGLimit);
      formData.append('Terms', this.editForm.value.Terms);
      formData.append('MotorCarrNo', this.editForm.value.MotorCarrNo);
      formData.append('CredAppBy', this.editForm.value.CredAppBy);
      formData.append('Email', this.editForm.value.Email);
      formData.append('RateDate', this.editForm.value.RateDate);
      formData.append('CredExpireMos', this.editForm.value.CredExpireMos);
      formData.append('Notes', this.editForm.value.Notes);
      formData.append('CredNote', this.editForm.value.CredNote);
      formData.append('Warning', this.editForm.value.Warning);
      formData.append('DotNo', this.editForm.value.DotNo);

      this.http.post(`https://everest.revinc.com:4202/api/updateDebtorDetails`, formData)
        .subscribe((response: any) => {
          console.log('Debtor detail update response:', response);
          if (response[0]['Result'] === "The credit limit you have assigned exceeds your authorized maximum") {
            this._snackBar.openFromComponent(WarningSnackbarComponent, 
              {
                data: { message: "The credit limit you have assigned exceeds your authorized maximum" },
                duration: 10000,
                verticalPosition: 'top',
                horizontalPosition: 'center'
              }
            );
          }
          else if (response[0]['Result'] === "Success") {
            this._snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: { message: "Debtor details updated successfully" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            if ( !(this.data?.ReloadPage && this.data?.ReloadPage === 'N') ) {
              window.location.reload();
            }
            else {
              this.dialogRef.close();
            }
            
          }
          else {
            this._snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: { message: "Error updating debtor details" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }
        }, error => {
          console.error('Error', error);
        });
    }
    // don't update the form if the user cancels the update nor if the form is invalid
    else {
      console.log('Update cancelled');
    }
  }

  onChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.changedNoaStatus = selectElement.value
  }

  getPaymentsImage(event: any) {
    this.clientService.convertDebtorsPaymentsImages(event.PmtChecksKey).subscribe(response => {
      console.log('file called', response);
    }, error => {
      console.error('file failed', error);
    }
    );
    this.clientService.startTimer(() => {
      this.clientService.getDebtorsPaymentsImages(event.PmtChecksKey).subscribe(response => {
        response.debtorPaymentImages.forEach(async (element: any) => {
          const fileName = element.FileName;
          this.fileExtension = this.getFileExtension(fileName);
          console.log(this.fileExtension);

          if (this.fileExtension == 'jpg' || this.fileExtension == 'jpeg' || this.fileExtension == 'png' || this.fileExtension == 'pdf') {
            window.open(`https://everest.revinc.com:4202/api/paymentsFiles/` + element.FileName);
          } else {
            window.open(`https://everest.revinc.com:4202/api/paymentsFiles/` + element.FileName + '.jpg');
          }

        });
      }, error => {
        console.error('file not converted', error);
      }
      );
    }, 3000);

  };

  onRadioChange(value: string) {
    this.selectedValue = value;
  }

  onChequeSearch() {
    if (this.chequeSearchForm.valid) {
      let DebtorKey = this.data.DebtorKey;
      let CheckNo = this.chequeSearchForm.value.CheckNo;
      let Amt = this.chequeSearchForm.value.Amt;
      let PostDateStart = this.chequeSearchForm.value.PostDateStart;
      let PostDateEnd = this.chequeSearchForm.value.PostDateEnd;
      let LastPayments = '';
      // if (this.chequeSearchForm.value.LastPayments == true) {
      LastPayments = 'Y';
      // } else {
      //   LastPayments = 'N'
      // }

      this.dataService.getDebtorsPayments(DebtorKey, CheckNo, Amt, PostDateStart, PostDateEnd, LastPayments).subscribe(response => {
        // console.log('Cheque Search Response:', response);
        if (response.payments.length === 0) {
          this.isChequeSearchEmpty = true;
        } 
        else {
          this.isChequeSearchLoading = false;
          this.paymentsDataSource.data = response.payments;
          this.Payment30 = response.payments[0].Payments30;
          this.Payment60 = response.payments[0].Payments60;
          this.Payment90 = response.payments[0].Payments90;
          this.Payment120 = response.payments[0].Payments120;
        }
        this.cdr.markForCheck(); // Manually trigger change detection
      });

    }
  }

  getFileExtension(filename: string): string { const extension = filename.split('.').pop(); return extension ? extension.toLowerCase() : ''; }

  

  onCreateTicket() {
    if (this.addNewTicketForm.valid) {
      console.log(this.addNewTicketForm.value);
      const formData = new FormData();
      formData.append('ClientKey', this.editForm.value.ClientKey);
      formData.append('DebtorKey', this.editForm.value.DebtorKey);
      formData.append('RequestAmt', this.editForm.value.RequestAmt);
      formData.append('RequestUser', this.editForm.value.RequestUser);
      formData.append('Comments', this.editForm.value.Comments);
      formData.append('SourceCode', this.editForm.value.SourceCode);
      formData.append('ReqContactKey', this.editForm.value.ReqContactKey);

      this.http.post(`https://everest.revinc.com:4202/api/CredRequestAdd`, formData)
        .subscribe(response => {
          console.log('New Credit Request Added', response);
          window.location.reload();
        }, error => {
          console.error('Error', error);
        });
    }
  }

  toggleRow(element: DebtorDataItem): void {
    console.log(element);

    this.expandedElement = this.expandedElement === element ? null : element;
  }

  isExpanded(element: DebtorDataItem): boolean {
    return this.expandedElement === element;
  }

  isExpansionDetailRow = (index: number, row: DebtorDataItem) => row.hasOwnProperty('expandedDetail');


  //region ticketPG functions
  // method to save research date
  onSaveResearchDate() {
    const rateDate = this.editTicketForm.get('RateDate')?.value;
    if (!rateDate ||  rateDate === this.debtorDetails?.RateDate?.split(' ')[0]) {
      return; // Don't proceed if empty
    }
    
    if (!this.debtorDetails) {
      console.warn('Cannot save research date: Debtor details not available');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to update the research date?'); // Add confirmation popup
    if (confirmed && this.debtorDetails) {

      const formData = new FormData();
      formData.append('DebtorKey', this.debtorDetails.DebtorKey);
      formData.append('Debtor', this.debtorDetails.Debtor);
      formData.append('Duns', this.debtorDetails.Duns);
      formData.append('Addr1', this.debtorDetails.Addr1);
      formData.append('Addr2', this.debtorDetails.Addr2);
      formData.append('Phone1', this.debtorDetails.Phone1);
      formData.append('Phone2', this.debtorDetails.Phone2);
      formData.append('City', this.debtorDetails.City);
      formData.append('State', this.debtorDetails.State);
      formData.append('TotalCreditLimit', this.debtorDetails.TotalCreditLimit);
      formData.append('IndivCreditLimit', this.debtorDetails.IndivCreditLimit);
      formData.append('AIGLimit', this.debtorDetails.AIGLimit);
      formData.append('Terms', this.debtorDetails.Terms);
      formData.append('MotorCarrNo', this.debtorDetails.MotorCarrNo);
      formData.append('CredAppBy', this.debtorDetails.CredAppBy);
      formData.append('Email', this.debtorDetails.Email);
      formData.append('RateDate', this.editTicketForm.value.RateDate); // get the RateDate from editTicketForm, others are keep the same
      formData.append('CredExpireMos', this.debtorDetails.CredExpireMos);
      formData.append('Notes', this.debtorDetails.Notes);
      formData.append('CredNote', this.debtorDetails.CredNote);
      formData.append('Warning', this.debtorDetails.Warning);
      formData.append('DotNo', this.debtorDetails.DotNo);
// console.log('formData:', this.debtorDetails, this.editTicketForm.value.RateDate);
      this.http.post(`https://everest.revinc.com:4202/api/updateDebtorDetails`, formData)
        .subscribe((response: any) => {
          console.log('Debtor detail update response:', response);
          if (response[0]['Result'] === "The credit limit you have assigned exceeds your authorized maximum") {
            this._snackBar.openFromComponent(WarningSnackbarComponent, 
              {
                // data: { message: "The credit limit you have assigned exceeds your authorized maximum" },
                data: { message: "Research data update failed" },
                duration: 10000,
                verticalPosition: 'top',
                horizontalPosition: 'center'
              }
            );
          }
          else if (response[0]['Result'] === "Success") {
            this._snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: { message: "Research date updated successfully" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            // update expires date if expires in months is available
            if (this.editTicketForm.get('ExpiresInMonths')?.value) {
              this.editTicketForm.patchValue({
                ExpiresDate: this.addMonths(this.editTicketForm.get('ExpiresInMonths')?.value)
              });
            }
          }
          else {
            this._snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: { message: "Error updating research data" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }
        }, error => {
          console.error('Error', error);
        });
    }
    // don't update the form if the user cancels the update nor if the form is invalid
    else {
      this.editTicketForm.patchValue({
        RateDate: this.debtorDetails.RateDate.split(' ')[0],
      });
      this.cdr.markForCheck();
      console.log('Update cancelled');
    }
  }
  // method the get debtor details from child component of trend tab
  updateDebtorDetails(debtorDetails: any) {
    console.log('Received debtor details from child component:', debtorDetails);
    
    // Store the debtor details in the component
    if (!this.debtorDetails) {
      this.debtorDetails = debtorDetails;
    }
    
    // Update any form fields or other data as needed
    if (this.editTicketForm) {
      // Update ticket form with fresh debtor details
      this.editTicketForm.patchValue({
        RateDate: debtorDetails?.RateDate ? debtorDetails.RateDate.split(' ')[0] : '',
        ExpiresInMonths: debtorDetails?.CredExpireMos || '1',
        ExpiresDate: debtorDetails?.CredExpireDate ? this.formateDate(debtorDetails?.CredExpireDate) : this.addMonths(debtorDetails?.CredExpireMos || '1'),
      });
    }
    
    // Trigger change detection to update the view
    this.cdr.markForCheck();
  }
  // method to caculate balanceShown number
  private updateTotalShown(): void {
    // Calculate total from filtered data
    let filteredTotal = 0;
    for (let item of this.statementsDataSource.data) {
      filteredTotal += Number(item.Balance) || 0;
    }
    this.balanceShown = this.formatCurrency(filteredTotal);
    this.totalQuantityShown = this.statementsDataSource.data.length.toString();
    
  }
  // method to handle status filter change
  onAgingTabFilterChange(): void {
    // Start with all data
    let filteredData = [...this.originalStatementsData];
    
    // Apply debtor filter if selected
    if (this.AgingTabSelectedDebtor) {
      filteredData = filteredData.filter(
        item => item.DtrName === this.AgingTabSelectedDebtor
      );
    }
    
    // Apply status filters if any selected
    if (this.AgingTabSelectedStatuses && this.AgingTabSelectedStatuses.length > 0) {
      filteredData = filteredData.filter(
        item => this.AgingTabSelectedStatuses.includes(item.Status)
      );
    }
    
    // Update data source
    this.statementsDataSource.data = filteredData;
    
    // Update balance totals
    this.updateTotalShown();
    
    // Reset expanded state
    this.expandedElement = null;
    
    // Apply sort if available
    if (this.statementsDataSource.sort) {
      this.statementsDataSource.sort.sortChange.emit();
    }
  }
  // method to get distinct credit request status list
  private extractUniqueStatuses(data: any[]): void {
    // Use Set to get unique values
    const statusSet = new Set<string>(
      data.map(item => item.Status).filter(status => status && status.trim() !== '')
    );
    
    // Convert Set to sorted array
    this.AgingTabStatusList = Array.from(statusSet).sort();
  }
  // Add this method to extract unique debtor names
  private extractUniqueDebtors(data: any[]): void {
    // Use Set to get unique values
    const debtorSet = new Set<string>(
      data.map(item => item.DtrName).filter(name => name && name.trim() !== '')
    );

    // Convert Set to sorted array
    this.AgingTabDebtorList = Array.from(debtorSet).sort();
  }

  // Add this method to handle filter changes
  // onAgingTabDebtorFilterChange(): void {
  //   // If "All Debtors" is selected (empty string)
  //   if (!this.AgingTabSelectedDebtor) {
  //     this.statementsDataSource.data = [...this.originalStatementsData];
  //   } else {
  //     // Filter data by selected debtor
  //     this.statementsDataSource.data = this.originalStatementsData.filter(
  //       item => item.DtrName === this.AgingTabSelectedDebtor
  //     );
  //   }
    
  //   // Update balance totals
  //   this.updateBalanceShown();

  //   // If using expandable rows, reset expanded state
  //   this.expandedElement = null;

  //   // Apply sort if available
  //   if (this.statementsDataSource.sort) {
  //     this.statementsDataSource.sort.sortChange.emit();
  //   }
  // }

  // method to close the dialog
  onCloseDialog(): void {
    this.dialogRef.close();
  }
  // Method to check if a form control has errors and has been touched
  hasFieldError(fieldName: string): boolean {
    const field = this.editTicketForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  // Method to get error message for a field
  getFieldErrorMessage(fieldName: string): string {
    const field = this.editTicketForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `Required`;
      }
    }
    return '';
  }
  // method to compare ApproveAmt with MasterTotalCreditLimit
  getApproveAmtValidationClass(): string {
    const approveAmt = this.parseCurrencyValue(this.editTicketForm.get('ApproveAmt')?.value || '0');
    const masterTotalLimit = this.parseCurrencyValue(this.editTicketForm.get('MasterTotalCreditLimit')?.value || '0');

    if (approveAmt < masterTotalLimit) {
      return 'input-error'; // Red border
    } else if (approveAmt >= masterTotalLimit) {
      return 'input-success'; // Green border
    }
    return ''; // Default styling
  }

  // Helper method to check if ApproveAmt is valid
  isApproveAmtValid(): boolean {
    const approveAmt = this.parseCurrencyValue(this.editTicketForm.get('ApproveAmt')?.value || '0');
    const masterTotalLimit = this.parseCurrencyValue(this.editTicketForm.get('MasterTotalCreditLimit')?.value || '0');
    return approveAmt >= masterTotalLimit;
  }
  // when ExpiresInMonths changed, updaste expires date too
  onExpiresInMonthsChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const months = parseInt(inputElement.value);

    if (!isNaN(months) && months > 0) {
      // Calculate the new expiry date
      const newExpiryDate = this.addMonths(months);

      // Update the ExpiresDate form control
      this.editTicketForm.get('ExpiresDate')?.setValue(newExpiryDate);
    }
  }
  // method to add months to current date
  private addMonths(months: number): string {
    let baseDate = new Date();
    if (this.editTicketForm && this.editTicketForm.get('RateDate')?.value){
      baseDate = new Date(this.editTicketForm.get('RateDate')?.value);
    }
    
    // Use toISOString() to get timezone-neutral date components
    const isoString = baseDate.toISOString();
    const datePart = isoString.split('T')[0]; // Get YYYY-MM-DD part
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    
    const originalDay = parseInt(dayStr);
    const originalMonth = parseInt(monthStr) - 1; // Convert to 0-indexed
    const originalYear = parseInt(yearStr);
    
    // Calculate target year and month
    const targetMonth = originalMonth + months;
    const targetYear = originalYear + Math.floor(targetMonth / 12);
    const normalizedTargetMonth = targetMonth % 12;
    
    // Create a date with the target year/month and original day
    const newDate = new Date(targetYear, normalizedTargetMonth, originalDay);
    
    // Handle case where the original day doesn't exist in the target month
    if (newDate.getMonth() !== normalizedTargetMonth) {
      // The date rolled over to the next month, so set to last day of target month
      newDate.setDate(0);
    }
    
    // return string in mm/dd/yyyy format
    const month = String(newDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(newDate.getDate()).padStart(2, '0');
    const year = String(newDate.getFullYear());
    return `${month}/${day}/${year}`;
  }
  // method to formate date to MM/DD/YYYY
  private formateDate(date: string): string {
    if (!date) {
      return '';
    }
    const dateParts = date.split(' ')[0].split('-');
    if (dateParts.length === 3) {
      return dateParts[1] + '/' + dateParts[2] + '/' + dateParts[0]; // MM/DD/YYYY
    }
    else {
      return date; // Return original if format is unexpected
    }
  }
  // convert YYYY-MM-DD HH:mm:ss to MM/DD/YYYY format
  private convertDateToMMDDYYYY(dateString: string): string {
    // check if dateString is empty or null
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
  // Add this method to your component for number formatting
  private formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Convert to number and format with 2 decimal places if needed
    const numValue = Number(value);
    if (isNaN(numValue)) return '';

    // Format with up to 2 decimal places, but don't show .00 for whole numbers
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  // function for fetching api data for the trend dialog and save to ticketingTrendDataSource
  loadTrendDialogData(DebtorKey:number, ClientNo:string, trendPeriodChar:string) {
    // console.log('loadTrendDialogData called');
    this.dataService.getDebtorClientTrendData(DebtorKey, ClientNo, trendPeriodChar).subscribe(response => {
      this.ticketingTrendDataSource.data = response.data;
      // console.log('Trend Data:', this.ticketingTrendDataSource.data);
      this.transferTrendDataToVertical(response.data);

      // for loading the chart
      if (this.chartCanvas && this.chartCanvas.nativeElement) {
        const tempPeriod = trendPeriodChar==='M' ? 'Months' : trendPeriodChar==='Q' ? 'Quarters' : 'Years';
        this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
        this.cdr.detectChanges(); // Force change detection
      }
      // deleyed loading of the chart
      else {
        setTimeout(() => {
          // console.log('Reloading the chart');
          const tempPeriod = trendPeriodChar==='M' ? 'Months' : trendPeriodChar==='Q' ? 'Quarters' : 'Years';
          this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
        }, 500);
      }

    });
  }

  // Generates an array of the 12 most recent periods 
  generateRecentPeriods(periodChar: string): string[] {
      const periodsArr: string[] = [];
      const today = new Date();
    if (periodChar === 'Q') {
      // Get current quarter and year
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      let currentQuarter = Math.floor(currentMonth / 3) + 1;
      let year = currentYear;
      
      // Generate last 12 quarters
      for (let i = 0; i < 12; i++) {
        periodsArr.push(`${year}-${currentQuarter}`);
        
        // Move to previous quarter
        currentQuarter--;
        if (currentQuarter === 0) {
          currentQuarter = 4;
          year--;
        }
      }
    }
    else if (periodChar === 'Y') {
      // Generate last 12 years
      const currentYear = today.getFullYear();
      for (let i = 0; i < 12; i++) {
        periodsArr.push(`${currentYear - i}`);
      }
    }
    else {
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        // Format as YYYY-MM
        const month = date.toISOString().substring(0, 7);
        periodsArr.push(month);
      }
    }
    return periodsArr;
  }
  // transfer the trend table data to vertical format
  transferTrendDataToVertical(tableData: any[]) {
    let tempData: TrendVerticalData[] = [{ Period: "Purchases" }, { Period: "Average" }, { Period: "Invoices" }, { Period: "Paid to zero" }, { Period: "Recoursed" }, { Period: "Avg Weighted Days" }];
    // initial columns headers
    let tempColumn = ['Period', ...this.generateRecentPeriods(this.trendPeriodChar)];

    for (let i = 1; i < tempColumn.length; i++) {
      let hasValues = false;
      for (let it of tableData.reverse()) {
        if (it.YearMonth === tempColumn[i]) {
          hasValues = true;
          tempData[0][tempColumn[i]] = this._decimalPipe.transform(it.Purchases, '1.0-0');
          tempData[1][tempColumn[i]] = this._decimalPipe.transform(it.PurchasesAvg, '1.0-0');
          tempData[2][tempColumn[i]] = it.PurchasesNo;
          tempData[3][tempColumn[i]] = it.PaiTodZero;
          tempData[4][tempColumn[i]] = it.Recoursed;
          tempData[5][tempColumn[i]] = this._decimalPipe.transform(it.AvgWeightedDays, '1.0-0');
          break;
        }
      }
      if (!hasValues) {
        tempData[0][tempColumn[i]] = '';
        tempData[1][tempColumn[i]] = '';
        tempData[2][tempColumn[i]] = '';
        tempData[3][tempColumn[i]] = '';
        tempData[4][tempColumn[i]] = '';
        tempData[5][tempColumn[i]] = '';
      }
    }
    this.ticketingTrendDataVertical = tempData;
    this.displayedColumnsVertical = tempColumn;
    // console.log('ticketingTrendDataVertical--', this.ticketingTrendDataVertical);
  }

  // event handler for the trend chart column change
  onTrendColumnChange() {
    const tempPeriod = this.trendPeriodChar==='M' ? 'Months' : this.trendPeriodChar==='Q' ? 'Quarters' : 'Years';
    this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
  }

  // event handler for the trend doalog period change
  onTrendPeriodChange(event: Event) {
    // const selectElement = event.target as HTMLSelectElement;
    // console.log(selectElement.value); 
    this.loadTrendDialogData(this.trendDebtorKey, this.trendClientNo, this.trendPeriodChar);
  }

  // submit the ticketing request tab form and save
  onTicketEdit() {
    // Mark all fields as touched to show validation errors
    this.editTicketForm.markAllAsTouched();
    if (this.editTicketForm.invalid) {
      console.log('Form is invalid, please check required fields');
      return;
    }
    console.log('editTicketForm value--', this.editTicketForm.value);
    // console.log('userID--', this.data.userID.toUpperCase());
    this.onApproveCreditRequest(this.editTicketForm.value.CredRequestKey, this.data.userID.toUpperCase(), this.editTicketForm.value.Action, this.editTicketForm.value.FreeTextInput, this.parseCurrencyValue(this.editTicketForm.value.ApproveAmt).toString(), this.parseCurrencyValue(this.editTicketForm.value.NewLimit).toString(), this.editTicketForm.value.ExpiresInMonths, this.editTicketForm.value.SendDecisionToClient?"Y":"N", this.editTicketForm.value.ChangeMaster?"Y":"N");
  }

  // generate the trend chart
  createTrendBarChart(data: any, period: string, column: string) {
    // console.log("data--", data);
    // convert column to readable word
    let columnName= '';
    switch (column) {
      case 'Purchases': 
        columnName = 'Purchases';
        break;
      case 'PurchasesAvg':
        columnName = 'Average';
        break;
      case 'PurchasesNo':
        columnName = 'Invoices';
        break;
      case 'PaiTodZero':
        columnName = 'Paid to zero';
        break;
      case 'Recoursed':
        columnName = 'Recoursed';
        break;
      case 'AvgWeightedDays':
        columnName = 'Average Weighted Days';
        break;
      default:
        columnName = column;
        break;
    }
    // filter the data base on parameters
    let tempLabels: string[] = [];
    let tempData: number[] = [];
    for (let it of data) {
      tempLabels.push(it.YearMonth);
      tempData.push(parseFloat(it[column]));
    }

    if (!this.chartCanvas) {
      console.warn('Chart canvas not initialized');
      return;
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        // labels: ['January', 'February', 'March', 'April', 'May'],
        labels: tempLabels,
        datasets: [
          // {
          //   label: 'Dataset 1',
          //   data: [65, 59, 80, 81, 56],
          //   backgroundColor: 'rgba(75, 192, 192, 0.5)',
          //   borderColor: 'rgb(75, 192, 192)',
          //   borderWidth: 1
          // },
          {
            label: columnName,
            data: tempData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            // change size of the title
            font: {
              size: 14,
              weight: 'bold',
            },
            display: true,
            text: period + ' ' + columnName + ' Trend',
          }
        }
      }
    });
  }


  // call api to get credit request status list
  getCreditRequestStatusList() {
    this.ticketingService.getCreditRequestStatusList().subscribe(response => {
      // console.log('Credit Request Status List:', response);
      this.actionList = response.data;
    }, error => {
      console.error('Error fetching credit request status list:', error);
    }
    );
  }

  // approve the credit request
  onApproveCreditRequest(credRequestKey: string, approveUser: string, status: string, response: string, approvedLimit: string, newLimitAmt: string, expMonths: string, email: string, changeMaster: string) {
    // confirm approval
    const confirmed = window.confirm('Are you sure you want to approve the credit request?');
    if (confirmed) {
      console.log('Approving credit request with values:', {
        credRequestKey, approveUser, status, response, approvedLimit, newLimitAmt, expMonths, email, changeMaster
      });
      this.ticketingService.approveCreditRequest2(credRequestKey, approveUser, status, response, approvedLimit, newLimitAmt, expMonths, email, changeMaster).subscribe(response => {
        console.log('Credit Request Approved 2:', response);

        // condition of input value exceed user limit
        if (response.response[0]['Result'] === "User Max Credit Limit Excedeed - Ticket not closed") {
          this._snackBar.openFromComponent(WarningSnackbarComponent,
            {
              data: { message: "The credit limit you have assigned exceeds your authorized maximum" },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            }
          );
        }
        // condition of request is locked by someone else
        else if (response.response[0]['Result'].includes("Ticket Locked by user:")) {
          this._snackBar.openFromComponent(WarningSnackbarComponent,
            {
              data: { message: response.response[0]['Result'] },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            }
          );
        }
        // condition of request is approved by someone else
        else if (response.response[0]['Result'].includes("Ticket already closed by")) {
          this._snackBar.openFromComponent(WarningSnackbarComponent,
            {
              data: { message: response.response[0]['Result'] },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            }
          );
        }
        // condition of request is approved and ticket is closed
        else if (response.response[0]['Result'] === "Ticket closed") {
          this._snackBar.openFromComponent(SuccessSnackbarComponent, {
            data: { message: "Credit request closed successfully" },
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
          // close the dislog and refresh the request list
          this.dialogRef.close();

        }

      }, error => {
        console.error('Error approving credit request 2:', error);
      }
      );

      // this.ticketingService.approveCreditRequest(credRequestKey, approveUser, status, response, approvedLimit, newLimitAmt, expMonths, email).subscribe(response => {
      //   console.log('Credit Request Approved:', response);
      //   // After dialog is closed, unlock the request
      //   this.ticketingService.actionToCreditRequest(parseInt(credRequestKey), approveUser, 'U').subscribe(response => {
      //     console.log('Request unlocked:', response);
      //   });
      //   window.location.reload(); // reload the page to reflect changes
      // }, error => {
      //   console.error('Error approving credit request:', error);
      // }
      // );
    }
  }

  // event handler for action change in the ticketing form
  onActionChange(event: any) {
    // Handle the selection change here
    const selectedAction = event.target.value;
    
    // You can update other form controls based on the selection
    if (['1', '6', '7'].includes(selectedAction)) { // when selected approval selections
      // change approved equal to requested amount
      this.editTicketForm.patchValue({
        ApproveAmt: this.formatCurrency(this.parseCurrencyValue(this.editTicketForm.value.RequestAmt) + this.parseCurrencyValue(this.editTicketForm.value.MasterTotalCreditLimit))
      });
    }
  }
  // Add this method to parse formatted currency strings back to numbers
  private parseCurrencyValue(value: string): number {
    if (!value) return 0;
    // Remove any non-numeric characters except decimal point
    return Number(value.replace(/[^\d.-]/g, ''));
  }

  // #endregion

  // #region debtor statement details functions
  // function for fetching api data for the trend dialog and save to ticketingTrendDataSource
  clickInvoiceNumber(element: any) {
    // console.log('element--', element);
    // Open a blank tab immediately
    const newTab = window.open('', '_blank');

    if (!newTab) {
      console.error('Failed to open new tab. Popup blocker might be enabled.');
      return;
    }

    // add progress spinner to the new tab
    newTab.document.body.innerHTML = `
      <html>
        <head>
          <title>Invoice - ${element.InvNo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .loading-message {
              text-align: center;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 10px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loading-message">
            <div class="spinner"></div>
            <p>Loading invoice ${element.InvNo}, please wait...</p>
          </div>
        </body>
      </html>
    `;

    // console.log("element--",element);
    // Call the API to get the invoice image, include stamp
    this.documentsReportsService.callInvoiceImageAPI(element.InvoiceKey, 1).subscribe((response: any) => {
      console.log('response--', response);

      //when no pdf string is returned
      if (response && response?.pdf) {
        // Decode the Base64 string and create a Blob
        const byteCharacters = atob(response.pdf);
        const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Create a URL for the Blob
        const blobUrl = URL.createObjectURL(blob);

        const fileName = "Invoice_" + element.InvNo;
        // Write the HTML content
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  height: 100vh;
                }
                #overlay-toolbar-title {
                  position: fixed;
                  min-width:300px;
                  top: 10px;
                  left: 50px;
                  z-index: 1000;
                  padding: 10px;
                  background: #3c3c3c;
                  color: white;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                #overlay-toolbar-download {
                  position: fixed;
                  top: 3px;
                  right: 80px;
                  left: auto;
                  z-index: 1000;
                  padding: 10px;
                  background: #3c3c3c;
                  color: white;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                #download-btn {
                  padding: 8px 16px;
                  background: #383b91;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                }
                #download-btn:hover {
                  background: #252763;
                }
                #pdf-container {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                }
                iframe {
                  width: 100%;
                  height: 100%;
                  border: none;
                }
              </style>
            </head>
            <body>
              <div id="overlay-toolbar-title">
                <span>${fileName}</span>
              </div>
              <div id="overlay-toolbar-download">
                <button id="download-btn" onclick="downloadPdf()">Download</button>
              </div>
              <div id="pdf-container">
                <iframe
                  src="${blobUrl}#view=FitH"
                  type="application/pdf"
                ></iframe>
              </div>
              <script>
                function downloadPdf() {
                  const link = document.createElement('a');
                  link.href = '${blobUrl}';
                  link.download = '${fileName}.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              </script>
            </body>
          </html>
        `);
        newTab.document.close();

        // Revoke the object URL when the tab is closed
        const revokeUrl = () => {
          URL.revokeObjectURL(blobUrl);
          console.log('Blob URL revoked');
        };
  
        const interval = setInterval(() => {
          if (newTab.closed) {
            clearInterval(interval);
            revokeUrl();
          }
        }, 1000);
      }
      // condition when no invoice found
      else if(response?.status == 'success'){
        // update the new tab with a message
        newTab.document.body.innerHTML = `
          <html>
            <head>
              <title>Invoice - ${element.InvNo}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                .loading-message {
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="loading-message">
                <p>No Invoice Images Found for ${element.InvNo}.</p>
              </div>
            </body>
          </html>
        `;
      }
      // condition when no pdf string is returned
      else {
        // update the new tab with a message
        newTab.document.body.innerHTML = `
          <html>
            <head>
              <title>Invoice - ${element.InvNo}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                .loading-message {
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="loading-message">
                <p>Loading invoice ${element.InvNo} is timeout, please close this tab and try again.</p>
              </div>
            </body>
          </html>
        `;
      }

    },
      (error) => {
        console.error('Error fetching invoice data:', error);
        newTab.close(); // Close the blank tab if the API call fails
      }
    );
  }


  // endregion

}
