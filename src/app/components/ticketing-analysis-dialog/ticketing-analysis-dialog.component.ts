import { ChangeDetectionStrategy, Component, Input, Inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { DecimalPipe } from '@angular/common';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip, LineController, LineElement, PointElement } from 'chart.js';
import { ClientsService } from '../../services/clients.service';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { AgingDocumentsDialogComponent } from '../aging-documents-dialog/aging-documents-dialog.component';
import { MatDrawer } from '@angular/material/sidenav';
import { HttpClient } from '@angular/common/http';
import { CacheService } from '../../services/cache.service';
import Swal from 'sweetalert2';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WarningSnackbarComponent, SuccessSnackbarComponent, ErrorSnackbarComponent } from '../custom-snackbars/custom-snackbars';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

// #region Duns search cards
interface DunsInfo {
  companyName: string;
  dunsNumber: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  matchConfidence?: string;
}

interface TrendVerticalData {
  Period: string;
  [key: string]: any;  // Allow any additional properties
}

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Title,
  Tooltip
);
// #endregion 



@Component({
  selector: 'app-ticketing-analysis',
  templateUrl: './ticketing-analysis-dialog.component.html',
  styleUrl: './ticketing-analysis-dialog.component.css',
  providers: [DecimalPipe]
})
export class TicketingAnalysisComponent implements OnInit {

  // variables for analysis dialog
  @Input() ticketData: any;
  @Input() agingData: any;
  currentUser: string = '';
  debtorDetails: any;
  trendPeriodChar: string = 'M';
  trendPeriodChar2: string = 'M';
  ticketingTrendDataSource = new MatTableDataSource<any>();
  ticketingTrendDataVertical: TrendVerticalData[] = []; // this is used for displaying trend data in vertical format
  displayedColumnsVertical: string[] = [];
  trendColumn: string = 'Purchases';
  ticketingTrendDataSource2 = new MatTableDataSource<any>();
  ticketingTrendDataVertical2: TrendVerticalData[] = []; // this is used for displaying trend data in vertical format
  displayedColumnsVertical2: string[] = [];
  trendColumn2: string = 'Purchases';
  readonly table1OpenState = signal(false);
  readonly panel1OpenState = signal(false);
  readonly table2OpenState = signal(false);
  readonly panel2OpenState = signal(false);
  ClientConcentrationPercentage: string = 'N/A';
  DebtorConcentrationPercentage: string = 'N/A';
  
  showDetailedView: string = 'default'; // default view for top right panel
  math = Math;

  // charts
  chart: any;
  @ViewChild('trendBarChart') chartCanvas!: ElementRef;
  chart2: any;
  @ViewChild('trendBarChart2') chartCanvas2!: ElementRef;

  // combined line chart and data
  combinedLineChart: any;
  @ViewChild('combinedLineChart') combinedLineChartCanvas!: ElementRef; // line chart (debtor - all clients) (Average weighted days, Purchases, Average, Invoices)
  combinedLineChartData: any = {
    columns: [...this.generateRecentPeriods('M')],
    rows:{
      'Purchases': [],
      'Payments': [],
      'Average': [],
      'Invoices': [],
      'AverageWeightedDays': []
    }
  };
  
  // debtor performance calculator results
  performanceResults: any = null;
  
  // flags to track data loading status for performance calculation
  debtorDetailsLoaded: boolean = false;
  trendData2Loaded: boolean = false;

  // last payment date
  readonly dialog = inject(MatDialog);

  // for duns and Ansonia APIs
  @ViewChild('drawer') drawer!: MatDrawer;
  debtorName: string = '';
  debtorFullAddress: string = '';
  countryCode: string = '';
  dunsMatches: DunsInfo[] = []; // store DUNS search results and used for displaying duns search cards
  loadingDuns = false;

  // nobuy code
  noBuyCodeList: any;
  selectedNoBuyKey: string = '';

  // send debtor details to parent component
  @Output() debtorDetailsChanged = new EventEmitter<any>();
  // send list of related client details to parent component
  @Output() relatedClientList = new EventEmitter<any[]>();
  emittedRelatedClientList: boolean = false;

  // snackbars
  private _snackBar = inject(MatSnackBar);

  // variable for storing number of relationship clients with balance and active status
  numOfRelationshipClients: number = 0;
  // variable for searching related clients or debtors by debtorKey or clientKey
  currentClientsRelationship: any = {}
  currentDebtorRelationship: any = {}

  // variables for switching debtors; 
  // Non-Grouped: not switchable; Member: switchable to Master, only one choice; Master: switchable to Member, could be multiple choices;
  originalDebtorType: string = 'N/A';
  originalDebtorKey: string = '';
  switchedDebtorType: string = 'N/A';
  switchedDebtorKey: string = '';
  switchableDebtors: any[] = []; // list of switchable debtors for the current debtor
  allRelatedDebtors: any[] = []; // list of all related debtors for the current debtor

  // alternate addresses
  alternateAddresses: any[] = [];

  // country and area list for address; [{CountryListKey, CountryAreaName, IsoAlpha2Code}]
  countryAreaList: any[] = [];

  loadingCurrentDebtorRelationship: boolean = false;

  debtorAlertsList: any[] = []; // store all debtor alerts
  debtorAlert:any = {}; // store the matched debtor alert by debtorKey

  debtorsTotalPastDue: {'Debtor': string, 'TotalPastDue': number}[] = [];

  constructor(
    // private dialogRef: MatDialogRef<TicketingAnalysisDialogComponent>, // remove this because it is not dialog anymore
    // @Inject(MAT_DIALOG_DATA) public data: any, // remove this because it is not dialog anymore
    private memberDebtorsService: MemberDebtorsService,
    private dataService: DebtorsApiService,
    private clientService: ClientsService,
    private clientsDebtorsService: ClientsDebtorsService,
    private _decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private cacheService: CacheService,
    private documentsReportsService: DocumentsReportsService,
  ) {}

  ngOnInit() {
    // Load analysis data
    console.log('ticketing-analysis-component, this.ticketData:', this.ticketData);
    console.log('ticketing-analysis-component, this.agingData:', this.agingData);
    // this.ticketData = this.data; // removebecause the data is used by dialog
    this.getDebtorsTotalPastDueBalance();

    this.originalDebtorKey = this.ticketData.DebtorKey;
    this.originalDebtorType = this.ticketData.Type;

    let tempDebtorKey: string;

    // load debtor alerts list and match the alert for the current debtor
    this.dataService.getDebtorAlertsList().subscribe((response: any) => {
      this.debtorAlertsList = response.data;
      this.debtorAlert = this.debtorAlertsList.find(alert => alert.DebtorKey === this.ticketData.DebtorKey) || {};
      // this.debtorAlert = this.debtorAlertsList.find(alert => alert.DebtorKey === '64663') || {}; // for testing
      // console.log('Alert list: ', this.debtorAlertsList);
      // console.log('matched debtor alert: ', this.debtorAlert);
    });

    // Get the logged in user for CredAppBy
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      this.currentUser = (profile as any).mail.match(/^([^@]*)@/)[1];
      
      // fetch debtor details
      if (this.ticketData.DebtorKey) {
        this.memberDebtorsService.getMemberDebtors(parseInt(this.ticketData.DebtorKey)).subscribe(response => {
          this.debtorDetails = response.data[0];
          let sumBalance = 0;
          let sumAgingBreakdown = {'Age0to30':0, 'Age31to60':0, 'Age61to90':0, 'Age91to120':0, 'Age121to150':0, 'Age151to180':0, 'AgeOver180':0};
          for (let it of response.data) {
            sumBalance += Number(it.Balance) || 0;
            sumAgingBreakdown.Age0to30 += Number(it.Age0to30) || 0;
            sumAgingBreakdown.Age31to60 += Number(it.Age31to60) || 0;
            sumAgingBreakdown.Age61to90 += Number(it.Age61to90) || 0;
            sumAgingBreakdown.Age91to120 += Number(it.Age91to120) || 0;
            sumAgingBreakdown.Age121to150 += Number(it.Age121to150) || 0;
            sumAgingBreakdown.Age151to180 += Number(it.Age151to180) || 0;
            sumAgingBreakdown.AgeOver180 += Number(it.AgeOver180) || 0;
            if (it.DebtorKey === this.ticketData.DebtorKey) {
              this.debtorDetails = it; 
              if (this.originalDebtorType === 'Member' && it.MasterDebtorKey !== '0') {
                tempDebtorKey = it.MasterDebtorKey;
              }
              // if (this.originalDebtorType === 'Member' || this.originalDebtorType === 'Non-Grouped' ) {
              //   if (this.originalDebtorType === 'Member'){
              //     this.switchableDebtors = [{DebtorKey: it.MasterDebtorKey, DebtorName: 'Master Debtor'}];
              //   }
              //   break;
              // }
            }
            // else if (this.originalDebtorType === 'Master') {
            //   this.switchableDebtors.push({DebtorKey: it.DebtorKey, DebtorName: it.Debtor, TotalAR: it.Balance});
            // }
            if (this.originalDebtorType === 'Master') {
              this.allRelatedDebtors = response.data; // store all related debtors
              this.switchableDebtors.push({DebtorKey: it.DebtorKey, DebtorName: it.Debtor, TotalAR: it.Balance, 
                isMaster: (this.originalDebtorKey === it.DebtorKey ? true : false), 
                FullAddress: this.formatAddress([it.Addr1, it.Addr2, it.City, it.State, it.Country, it.ZipCode]),
                Phone: (it.Phone1 + (it.Phone2 ? '; ' + it.Phone2 : '')), Email: it.Email, MotorCarrNo: it.MotorCarrNo,
              });
            }
          }
          this.reorderSwitchableDebtors(); // reorder the switchable debtors
          // if the debtor type is Master, set the balance to sum of all member debtors
          if (this.originalDebtorType === 'Master'){
            this.debtorDetails.Balance = '' + sumBalance;
            this.debtorDetails.Age0to30 = '' + sumAgingBreakdown.Age0to30;
            this.debtorDetails.Age31to60 = '' + sumAgingBreakdown.Age31to60;
            this.debtorDetails.Age61to90 = '' + sumAgingBreakdown.Age61to90;
            this.debtorDetails.Age91to120 = '' + sumAgingBreakdown.Age91to120;
            this.debtorDetails.Age121to150 = '' + sumAgingBreakdown.Age121to150;
            this.debtorDetails.Age151to180 = '' + sumAgingBreakdown.Age151to180;
            this.debtorDetails.AgeOver180 = '' + sumAgingBreakdown.AgeOver180;
            for (let it of this.switchableDebtors) {
              if (it.DebtorKey === this.originalDebtorKey) {
                it.TotalAR = sumBalance;
              }
            }
          }

          // set switchableDebtors list when the original debtor is Member
          sumBalance = 0;
          if (this.originalDebtorType === 'Member' && tempDebtorKey) {
            this.memberDebtorsService.getMemberDebtors(parseInt(tempDebtorKey)).subscribe(response => {
              this.allRelatedDebtors = response.data; // store all related debtors
              for (let it of response.data) {
                sumBalance += Number(it.Balance) || 0;
                this.switchableDebtors.push({DebtorKey: it.DebtorKey, DebtorName: it.Debtor, TotalAR: it.Balance, 
                  isMaster: (tempDebtorKey === it.DebtorKey ? true : false), 
                  FullAddress: this.formatAddress([it.Addr1, it.Addr2, it.City, it.State, it.Country, it.ZipCode]),
                  Phone: (it.Phone1 + (it.Phone2 ? '; ' + it.Phone2 : '')), Email: it.Email, MotorCarrNo: it.MotorCarrNo,
                });
              }
              for (let it of this.switchableDebtors) {
                if (it.DebtorKey === tempDebtorKey) {
                  it.TotalAR = sumBalance;
                }
              }
              this.reorderSwitchableDebtors(); // reorder the switchable debtors
            });
          }

          this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
          console.log('ticketing-analysis-component, this.debtorDetails:', this.debtorDetails);
          
          // Emit the debtor details to the parent component
          this.debtorDetailsChanged.emit(this.debtorDetails);
          
          // fetch no buy code list and set the default no buy code after debtor details are loaded
          this.getNoBuyCodeList();
          
          // Mark debtor details as loaded and check if we can calculate performance
          this.debtorDetailsLoaded = true;
          this.checkAndCalculatePerformance();
        }, error => {
          console.error('Error fetching member debtors:', error);
        });
      }
    });

    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2
  
    // get alternate addresses
    this.getDebtorAlternateAddresses(parseInt(this.ticketData.DebtorKey));

    // fetch client concentration percentage
    this.searchAllClientsByDebtorKey(parseInt(this.ticketData.DebtorKey), parseInt(this.ticketData.ClientKey));
    // fetch debtor concentration percentage
    this.loadDebtorConcentrationPercentage(parseInt(this.ticketData.DebtorKey), parseInt(this.ticketData.ClientKey));

    // load combined line chart data
    this.loadCombinedLineChartData(this.ticketData.DebtorKey);

    // load country and area list
    this.loadCountryAreaList();

  }

  // convert string number to currency format
  formatCurrency(inputValue: any, numStringArr?: any[]): string {
    let value: number;
    
    if (inputValue === null || inputValue === undefined || inputValue === '') {
      value = 0;
    }
    else {
      value = Number(inputValue);
    }

    if (typeof numStringArr !== 'undefined') {
      for (let it of numStringArr) {
        if (it !== null && it !== undefined && it !== '') {
          value = value + Number(it);
        }
      }
    }

    if (isNaN(value)) return '';

    // Format with up to 2 decimal places, but don't show .00 for whole numbers
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  // convert string number to percentage
  formatPercentage(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Convert to number and format with 2 decimal places if needed
    const numValue = Number(value);
    if (isNaN(numValue)) return '';

    // Format percentage with no decimal places
    return numValue.toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
   
  }

  // method to format email addresses
  formatEmail(email: string): string {
    if (!email) return '';
    let emails = email.split(';');
    let formattedEmail = '';
    for (let e of emails) {
      formattedEmail += e.trim() + '\n';
    }
    return formattedEmail.trim();
  }

  // event handler for the trend doalog period change
  onTrendPeriodChange(event: Event) {
    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1);
  }
  onTrendPeriod2Change(event: Event) {
    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), '', this.trendPeriodChar2, 2);
  }

  // function for fetching api data for the trend dialog and save to ticketingTrendDataSource
  loadTrendDialogData(DebtorKey: number, ClientNo: string, trendPeriodChar: string, chartNumber: number = 1) {
    // console.log('loadTrendDialogData called');
    this.dataService.getDebtorClientTrendData(DebtorKey, ClientNo, trendPeriodChar).subscribe(response => {
      if (chartNumber === 1) {
        this.ticketingTrendDataSource.data = response.data;
      }
      else {
        this.ticketingTrendDataSource2.data = response.data;
      }
      // console.log('Trend Data:', this.ticketingTrendDataSource.data);
      this.transferTrendDataToVertical(response.data, chartNumber);
    
      this.cdr.detectChanges(); // Trigger change detection

      // for loading the chart 1
      if (chartNumber === 1){
        if (this.chartCanvas && this.chartCanvas.nativeElement) {
          const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
          this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
          this.cdr.detectChanges(); // Trigger change detection
        }
        // deleyed loading of the chart
        else {
          setTimeout(() => {
            // console.log('Reloading the chart');
            const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
            this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
            this.cdr.detectChanges(); // Trigger change detection
          }, 500);
        }
      }
      else {
        if (this.chartCanvas2 && this.chartCanvas2.nativeElement) {
          const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
          this.createTrendBarChart(this.ticketingTrendDataSource2.data, tempPeriod, this.trendColumn2, 2);
          this.cdr.detectChanges(); // Trigger change detection
        }
        // deleyed loading of the chart
        else {
          setTimeout(() => {
            // console.log('Reloading the chart');
            const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
            this.createTrendBarChart(this.ticketingTrendDataSource2.data, tempPeriod, this.trendColumn2, 2);
            this.cdr.detectChanges(); // Trigger change detection
          }, 500);
        }

        // Mark trend data 2 as loaded and check if we can calculate performance
        this.trendData2Loaded = true;
        this.checkAndCalculatePerformance();
      }

    });
  }

  // load concentration percentage number of a client related to a debtor
  searchAllClientsByDebtorKey(DebtorKey: number, ClientKey: number): void {
    this.clientService.getClients(DebtorKey).subscribe(response => {
      console.log("ticketing-analysis-component, getClients by debtorKey: ", response.data);
      if (!this.emittedRelatedClientList){
        this.relatedClientList.emit(response.data);
        this.emittedRelatedClientList = true;
      }
      // get the concentration number by searching the ClientKey
      // get number of relationship clients with outstanding balance and active status
      // reset numOfRelationshipClients to 0 before counting
      this.numOfRelationshipClients = 0;
      this.ClientConcentrationPercentage = 'N/A';
      this.currentClientsRelationship = {};
      for (let it of response.data) {
        if (it.Inactive === '0' && parseFloat(it.Balance) > 0) {
          this.numOfRelationshipClients++;
        }
        if (this.ClientConcentrationPercentage === 'N/A' && parseInt(it.ClientKey) === ClientKey) {
          this.ClientConcentrationPercentage = Math.round(parseFloat(it.Concentration) * 10000) / 100 + '%';
          this.currentClientsRelationship = it;
        }
      }
    });
  }

  // load concentration percentage number of a debtor related to a client
  loadDebtorConcentrationPercentage(DebtorKey: number, ClientKey: number): void {
    this.loadingCurrentDebtorRelationship = true;
    // reset parameters
    this.DebtorConcentrationPercentage = 'N/A';
    this.currentDebtorRelationship = {};
    this.clientsDebtorsService.getClientsDebtors(ClientKey).subscribe(response => {
      console.log("ticketing-analysis-component, getClientsDebtors by clientKey: ", response.data);
      for (let it of response.data) {
        if (parseInt(it.DebtorKey) === DebtorKey) {
          this.currentDebtorRelationship = it;
          this.DebtorConcentrationPercentage = Math.round(parseFloat(it.Concentration) * 10000) / 100 + '%';
          break;
        }
      }
      this.loadingCurrentDebtorRelationship = false;
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  // calculate percentage and return formatted string
  calculatePercentage(valueStr: string, totalStr: string): string {
    let total = parseFloat(totalStr);
    let value = parseFloat(valueStr);
    if (total === 0 || isNaN(value) || isNaN(total)) return '0%';
    // const percentage = Math.round((value / total) * 10000) / 100; // Calculate percentage with 2 decimal places
    const percentage = Math.round((value / total) * 100); // Calculate percentage with 0 decimal places
    return percentage + '%';
  }

  // get sum of array of string numbers
  getSumOfArray(arr: string[]): number {
    return arr.reduce((sum, value) => {
      const numValue = parseFloat(value);
      return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
  }

  // transfer the trend table data to vertical format
  transferTrendDataToVertical(tableData: any[], chartNumber: number = 1) {
    let tempData: TrendVerticalData[] = [{ Period: "Purchases" }, { Period: "Average" }, { Period: "Payments" }, { Period: "Invoices" }, { Period: "Paid to zero" }, { Period: "Recoursed" }, { Period: "Avg Weighted Days" }];
    // initial columns headers
    const periodChar = chartNumber === 1 ? this.trendPeriodChar : this.trendPeriodChar2;
    let tempColumn = ['Period', ...this.generateRecentPeriods(periodChar)];

    for (let i = 1; i < tempColumn.length; i++) {
      let hasValues = false;
      for (let it of tableData.reverse()) {
        if (it.YearMonth === tempColumn[i]) {
          hasValues = true;
          tempData[0][tempColumn[i]] = this._decimalPipe.transform(it.Purchases, '1.0-0');
          tempData[1][tempColumn[i]] = this._decimalPipe.transform(it.PurchasesAvg, '1.0-0');
          tempData[2][tempColumn[i]] = this._decimalPipe.transform(it.Payments, '1.0-0');
          tempData[3][tempColumn[i]] = it.PurchasesNo;
          tempData[4][tempColumn[i]] = it.PaiTodZero;
          tempData[5][tempColumn[i]] = it.Recoursed;
          tempData[6][tempColumn[i]] = this._decimalPipe.transform(it.AvgWeightedDays, '1.0-0');
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
        tempData[6][tempColumn[i]] = '';
      }
    }
    if (chartNumber === 1) {
      this.ticketingTrendDataVertical = tempData;
      this.displayedColumnsVertical = tempColumn;
    }
    else {
      this.ticketingTrendDataVertical2 = tempData;
      this.displayedColumnsVertical2 = tempColumn;
      // console.log('ticketingTrendDataVertical2--', this.ticketingTrendDataVertical2);
      // console.log('displayedColumnsVertical2--', this.displayedColumnsVertical2);
    }
    // console.log('ticketingTrendDataVertical--', this.ticketingTrendDataVertical);
  }

  // event handler for the trend chart column change
  onTrendColumnChange() {
    const tempPeriod = this.trendPeriodChar === 'M' ? 'Months' : this.trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
    this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn, 1);
  }
  onTrendColumnChange2() {
    const tempPeriod = this.trendPeriodChar2 === 'M' ? 'Months' : this.trendPeriodChar2 === 'Q' ? 'Quarters' : 'Years';
    this.createTrendBarChart(this.ticketingTrendDataSource2.data, tempPeriod, this.trendColumn2, 2);
  }

  // generate the trend chart
  createTrendBarChart(data: any, period: string, column: string, chartNumber: number = 1) {
    // console.log("chart data--", data);
    let periodChar = period.charAt(0).toUpperCase();
    // console.log("chart recent periods--", this.generateRecentPeriods(period));
    // convert column to readable word
    let columnName = '';
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
    // let tempLabels: string[] = [];
    // let tempData: number[] = [];
    // for (let it of data) {
    //   tempLabels.push(it.YearMonth);
    //   tempData.push(parseFloat(it[column]));
    // }

    // setup data base on recent periods which is same with table periods
    let recentPeriods = this.generateRecentPeriods(periodChar);
    let tempData: number[] = [];
    for (let it of recentPeriods) {
      let found = false;
      for (let item of data) {
        if (item.YearMonth === it) {
          tempData.push(parseFloat(item[column]));
          found = true;
          break;
        }
      }
      if (!found) {
        tempData.push(0); // or any default value you want to use
      }
    }


    if (chartNumber === 1){
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
          labels: recentPeriods,
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
    else {
      if (!this.chartCanvas2) {
        console.warn('Chart canvas 2 not initialized');
        return;
      }
      const ctx = this.chartCanvas2.nativeElement.getContext('2d');

      if (this.chart2) {
        this.chart2.destroy();
      }
      this.chart2 = new Chart(ctx, {
        type: 'bar',
        data: {
          // labels: ['January', 'February', 'March', 'April', 'May'],
          labels: recentPeriods,
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

  // Remove the onClose method since it's no longer a dialog
  // onClose(): void {
  //   this.dialogRef.close();
  // }

  // method to show detailed view
  onMoreDetailsClick(name: string): void {
    if (name && name !== this.showDetailedView) {
      this.showDetailedView = name;
    }
    else {
      this.showDetailedView = 'default'; // reset to default view
    }
  }

  // method to click on last pament date and open cheque search dialog
  openChecqueSearchDialog(DebtorKey: number) {
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

  // event of searching Duns number
  searchDuns(element: any) {
    // set the selected debtor details
    // this.selectedDebtorDetails = element;

    if (this.drawer) {
      this.drawer.toggle();
    }

    // console.log("element--", element);
    let fullAddress = "";

    fullAddress = this.formatAddress([element.Addr1, element.Addr2, element.City, element.State, element.Country, element.ZipCode]);
    this.debtorName = element.Debtor;
    this.debtorFullAddress = fullAddress;
    this.countryCode = this.convertCountryToCode(element.Country);

    this.loadingDuns = true;

    this.dataService.searchDuns(this.debtorName, element.Addr1, element.Addr2, element.City, element.State, element.ZipCode, this.countryCode).subscribe((response: any) => {
      console.log('searchDuns response--', response);
      this.loadingDuns = false;
      this.dunsMatches = response.results.matchCandidates.map((match: any) => ({
        companyName: match.organization.primaryName || 'N/A',
        dunsNumber: match.organization.duns || 'N/A',
        address: this.combineAddress(match.organization.primaryAddress.streetAddress.line1, match.organization.primaryAddress.streetAddress.line2) || 'N/A',
        city: match.organization.primaryAddress.addressLocality.name || 'N/A',
        state: match.organization.primaryAddress.addressRegion.abbreviatedName || 'N/A',
        phone: match.organization.telephone.telephoneNumber || 'N/A',
        matchConfidence: match.matchQualityInformation.confidenceCode || 'N/A'
      }));
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  // method to take in address and return a formatted address, array pareameter in this order: [Addr1, Addr2, City, State, Country, ZipCode]
  formatAddress(addresses: string[]): string {
    // Filter out empty, null, or undefined values, then join
    return addresses
      .filter(addr => addr && addr.trim() !== '')
      .join(', ')
      .trim();
  }

  // convert country name to code, US and CA only
  private convertCountryToCode(country: string): string {
    if (country.toLowerCase() === 'united states' || country.toLowerCase() === 'us') {
      return 'US';
    } else if (country.toLowerCase() === 'canada' || country.toLowerCase() === 'ca') {
      return 'CA';
    }
    return '';
  }

  // conbine address line1 and line2
  private combineAddress(address1: string, address2: string): string {
    let combinedAddress = address1 || '';
    if (address2) {
      combinedAddress += ', ' + address2;
    }
    return combinedAddress.trim();
  }

  // Add this method to your MasterDebtorsComponent class
  searchDunsByNameOnly(): void {
    if (!this.debtorName) {
      return;
    }

    this.loadingDuns = true;

    // Use only the company name for search, without address
    this.dataService.searchDuns(this.debtorName, '', '', '', '', '', this.countryCode).subscribe({
      next: (response: any) => {
        console.log('searchDunsByNameOnly response--', response);
        this.loadingDuns = false;
        this.dunsMatches = response.results.matchCandidates.map((match: any) => ({
          companyName: match.organization.primaryName || 'N/A',
          dunsNumber: match.organization.duns || 'N/A',
          address: this.combineAddress(match.organization.primaryAddress.streetAddress.line1, match.organization.primaryAddress.streetAddress.line2) || 'N/A',
          city: match.organization.primaryAddress.addressLocality.name || 'N/A',
          state: match.organization.primaryAddress.addressRegion.abbreviatedName || 'N/A',
          phone: match.organization.telephone.telephoneNumber || 'N/A',
          matchConfidence: match.matchQualityInformation.confidenceCode || 'N/A'
        }));
      },
      error: (err) => {
        console.error('Error searching by name only:', err);
        this.loadingDuns = false;
        this.dunsMatches = [];
      }
    });
  }

  // Add this method to handle the DUNS selection and update
  updateDebtorWithDunsInfo(event: DunsInfo): void {
    console.log('Selected DUNS info:', event);
    console.log('Selected debtor details:', this.debtorDetails);
    // User confirmed, proceed with update  
    const formData = new FormData();
    if (this.debtorDetails) {
      formData.append('DebtorKey', this.debtorDetails.DebtorKey.toString());
      formData.append('Debtor', this.debtorDetails.Debtor);
      formData.append('Duns', event.dunsNumber);
      formData.append('Addr1', this.debtorDetails.Addr1);
      formData.append('Addr2', this.debtorDetails.Addr2);
      formData.append('Phone1', this.debtorDetails.Phone1.toString());
      formData.append('Phone2', this.debtorDetails.Phone2.toString());
      formData.append('City', this.debtorDetails.City);
      formData.append('State', this.debtorDetails.State);
      formData.append('TotalCreditLimit', this.debtorDetails.TotalCreditLimit.toString());
      formData.append('IndivCreditLimit', this.debtorDetails.IndivCreditLimit.toString());
      formData.append('AIGLimit', this.debtorDetails.AIGLimit);
      formData.append('Terms', this.debtorDetails.Terms);
      formData.append('MotorCarrNo', this.debtorDetails.MotorCarrNo.toString());
      formData.append('Email', this.debtorDetails.Email);
      formData.append('RateDate', this.debtorDetails.RateDate);
      formData.append('CredExpireMos', this.debtorDetails.CredExpireMos.toString());
      formData.append('Notes', this.debtorDetails.Notes);
      formData.append('CredNote', this.debtorDetails.CredNote);
      formData.append('Warning', this.debtorDetails.Warning);
      formData.append('DotNo', this.debtorDetails.DotNo);
    }

    formData.append('CredAppBy', this.currentUser.toUpperCase());

    // Call the API service to update the debtor
    this.dataService.updateDebtorDetails(formData).subscribe({
      next: (response) => {
        // Clear master debtors data cache for showing updated Duns
        this.cacheService.removeByPattern('/api/memberDebtors?');

        // Show success message
        this.drawer.close(); // Close the drawer
        this._snackBar.openFromComponent(SuccessSnackbarComponent, {
          data: { message: "Debtor information updated successfully with DUNS data." },
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        this.debtorDetails.DbDunsNo = event.dunsNumber; // Refresh the duns number
        this.cdr.detectChanges(); // Trigger change detection
      },
      error: (error) => {
        this._snackBar.openFromComponent(ErrorSnackbarComponent, {
          data: { message: "Failed to update debtor DUNS: " + error.error.message },
          duration: 10000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        console.error('Error updating debtor details:', error);
      }
    });
  }

  // event of clicking Ansonia report button 
  getAnsoniaReportLink(element: any) {
    // console.log("element--",element);
    this.documentsReportsService.callAnsoniaAPI(element?.MotorCarrNo ?? '', element.Debtor ?? '', element.Addr1 ?? '', element.City ?? '', element.State ?? '', element.Country ?? '').subscribe((response: { url: string }) => {
      // console.log('response--', response);
      window.open(response.url, "_blank");
    });
  }

  // Call the API to get the no buy Code List
  getNoBuyCodeList() {
    this.dataService.getDebtorNoBuyCodeList().subscribe((response: any) => {
      this.noBuyCodeList = response.data;
      this.setDefaultNoBuyCode();
    });
  }

  // method to set the default No Buy Code and check if in the list
  setDefaultNoBuyCode() {
    if (!this.debtorDetails || !this.noBuyCodeList) {
      console.log('Debtor details or No Buy Code list not available: ', this.debtorDetails, this.noBuyCodeList);
      return;
    }
    // Find the matching DisputeCodeKey for the debtor's NoBuyCode
    const matchingCode = this.noBuyCodeList.find(
      (code: { DisputeCode: string; DisputeCodeKey: string }) => code.DisputeCode === this.debtorDetails.NoBuyCode
    );
    
    if (matchingCode) {
      this.selectedNoBuyKey = matchingCode.DisputeCodeKey;
    } else {
      this.selectedNoBuyKey = '-1'; // Default to 'No Buy Code' if not found
    }
    this.cdr.detectChanges(); // Trigger change detection
  }

  // Event handler for No Buy Code changes
  onNoBuyCodeChange(event: any) {
    // when user want to clear no buy code
    if (event.value === '') {
      this.saveNoBuyCode('', 'Clear No Buy Code');
    }
    else {
      // find the selected code object
      const selectedCode = this.noBuyCodeList.find(
        (code: { DisputeCodeKey: string; DisputeCode: string }) => code.DisputeCodeKey === event.value
      );
      // If you need to save the change to the server
      this.saveNoBuyCode(selectedCode.DisputeCodeKey, selectedCode.DisputeCode);
    }
  }

  // Method to save No Buy Code changes
  saveNoBuyCode(codeKey: string, code: string) {
    if (!this.debtorDetails || !this.debtorDetails.DebtorKey || !this.currentUser) return;

    // ask for confirmation before saving
    Swal.fire({
      title: 'Confirm No Buy Code Change',
      text: code==='Clear No Buy Code' ? 'Do you want to remove the current No Buy Code?' : 'Do you want to update the No Buy Code to' + code + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Call the service to update the No Buy Code
        this.dataService.updateDebtorNoBuyCode(parseInt(codeKey),parseInt(this.debtorDetails.DebtorKey), this.currentUser).subscribe({
          next: (response) => {
            console.log(response);

            this.debtorDetails.NoBuyCode = code==="Clear No Buy Code"?'':code; // Update the debtor details with the new No Buy Code
            this.setDefaultNoBuyCode(); // Reset the selected code to the updated one
            // after successful update, clear the master debtors cache to show updated no buy code
            this.cacheService.removeByPattern('/api/memberDebtors?');

            this._snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: { message: "No buy code updated successfully" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          },
          error: (error) => {
            console.error('Error updating No Buy Code:', error);
            this._snackBar.openFromComponent(ErrorSnackbarComponent, {
              data: { message: "Error updating no buy code: " + error.error.message },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            // Reset the selected code if error
            this.setDefaultNoBuyCode();
          }
        });
      } else {
        // Reset the selected code if cancelled
        this.setDefaultNoBuyCode();
      }
    });
    
  }

  // event handler for the edit debtor button
  editDebtor(row: any) {
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
        Country: row.Country,
        ZipCode: row.ZipCode,
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
        RateDate: row.RateDate || '',
        CredExpireDate: row.CredExpireDate,
        openForm: 'editForm',
        CredAppBy: this.currentUser,
        CredNote: row.CredNote,
        Notes: row.Notes,
        Warning: row.Warning,
        CredExpireMos: row.CredExpireMos,
        DotNo: row.DotNo,
        ReloadPage: 'N'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.cacheService.removeByPattern('/api/memberDebtors?');
      this.memberDebtorsService.getMemberDebtors(parseInt(this.debtorDetails.DebtorKey)).subscribe(response => {
        let sumBalance = 0;
        let isMasterflag = this.debtorDetails.MasterDebtorKey === '0';
        for (let it of response.data) {
          if (it.DebtorKey === this.debtorDetails.DebtorKey) {
            this.debtorDetails = it;
          }
          sumBalance += Number(it.Balance) || 0;
        }
        // if it is master debtor, update the balance to sum of all related debtors
        if (isMasterflag) {
          this.debtorDetails.Balance = '' + sumBalance;
        }

        this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
        console.log('ticketing-analysis-component, Switched, this.debtorDetails:', this.debtorDetails);
        
        // Reset loading flags and wait for new trend data to load after editing
        this.debtorDetailsLoaded = true;
        this.trendData2Loaded = false;
        this.performanceResults = null;

        this.cacheService.removeByPattern('/api/debtorHistoryTrend?'); // clear the debtor history trend cache
        this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
        this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2
      
        // fetch client concentration percentage
        this.cacheService.removeByPattern('/api/clients?'); // clear the clients cache
        this.searchAllClientsByDebtorKey(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));
        // fetch debtor concentration percentage
        this.cacheService.removeByPattern('/api/ClientsDebtors?'); // clear the clientsDebtors cache
        this.loadDebtorConcentrationPercentage(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));

        // reload alternate addresses
        this.cacheService.removeByPattern('/api/getDebtorAlternateAddresses?'); // clear the debtor alternate address cache
        this.getDebtorAlternateAddresses(this.debtorDetails.DebtorKey);

        // load combined line chart data
        this.loadCombinedLineChartData(this.debtorDetails.DebtorKey);

        this.cdr.detectChanges(); // Trigger change detection
        console.log('Edited debtor details and reload all information.', this.debtorDetails);
        
      }, error => {
        console.error('Error refresh member debtor details:', error);
      });
    });
  }

  // calculate the gap year, month and days from today to given date
  calculateGapDays(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const givenDate = new Date(dateStr);
    const today = new Date();
    // Calculate the difference in milliseconds
    const diffTime = today.getTime() - givenDate.getTime();
    // returns 
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      const years = diffDays / 365;
      return +years.toFixed(1) + ' years ago';
    }
    else {
      return diffDays + ' days ago';
    }
  }

  // method to change text color depending on value and data type
  textColorByValueAndType(value: string, type: string = 'text'): string {
    if (value === 'N/A') {
      return 'na-text';
    }
    if (value === 'TBD') {
      return 'tbd-text';
    }

    if (type === 'AnsoniaRiskScore') {
      if (value && !isNaN(Number(value))) {
        let tempNum = Number(value);
        if (tempNum >= 87 && tempNum <= 100) {
          return 'success';
        }
        else if (tempNum >= 70 && tempNum <= 86) {
          return 'warning';
        }
        else {
          return 'danger';
        }
      }
    }
    else if (type === 'InternalRating') {
      if (value === 'A') {
        return 'A-Rating';
      }
      else if (value === 'B') {
        return 'B-Rating';
      }
      else if (value === 'C') {
        return 'C-Rating';
      }
      else if (value === 'D') {
        return 'D-Rating';
      }
      else if (value === 'E') {
        return 'E-Rating';
      }
      else {
        return 'na-text';
      }
    }
    else if (type === 'DiffDaysLastPayment') {
      if (value === 'Payment delayed'){
        return 'danger';
      }
      else if (value === 'Stable'){
        return 'success';
      }
    }

    return '';
  }

  // method to return description message by value and type
  descriptionByValueAndType(value: string, type: string = 'N/A'): string {
    if (type === 'AnsoniaRiskScore') {
      if (value && !isNaN(Number(value))) {
        let tempNum = Number(value);
        if (tempNum >= 87 && tempNum <= 100) {
          return 'Low Risk';
        }
        else if (tempNum >= 70 && tempNum <= 86) {
          return 'Med Risk';
        }
        else {
          return 'High Risk';
        }
      }
    }
    else if (type === 'DiffDaysLastPayment') {
      if (value && !isNaN(parseInt(value))) {
        let tempNum = parseInt(value);
        if (tempNum > this.debtorDetails?.DSO30) {
          return 'Payment delayed';
        }
        else {
          return 'Stable';
        }
      }
    }

    return '';
  }

  // method to open document dialog
  openDocumentsDialog(DebtorKey: number) {
    this.dataService.getDebtorsDocuments(DebtorKey).subscribe(response => {

      const dialogRef = this.dialog.open(DocumentDialogComponent, {
        width: 'auto',
        maxWidth: 'none',
        height: 'auto',
        panelClass: 'custom-dialog-container',
        data: {
          DebtorKey: DebtorKey,
          documentsList: response.documentsList,
          documentCategory: response.DocumentsCat,
          documentsFolder: response.DocumentsFolder,
          userAccessLevel: "Full"
        }
      });

      dialogRef.afterClosed().subscribe(result => {

      });
    });
  }

  // method to open debtor audit dialog
  openDebtorAuditDialog(DebtorKey: number) {

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

  // method to open relationship details dialog
  openAdditionalDetailsDialog() {
    const dialogRef = this.dialog.open(DocumentDialogComponent, {
      width: '600px',
      maxWidth: 'none',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: {
        relationshipDetails: {
          expInMonths: 'TBD', // You can replace these with actual data properties
          researchDate: 'TBD',
          creditOverride: 'TBD',
          relationshipNoBuy: 'TBD'
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle dialog closed if needed
    });
  }

  // method to open aging documents dialog
  openAgingDocumentsDialog(passMode: string) {
    if (this.loadingCurrentDebtorRelationship){
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "Please wait the loading process and try again." },
        duration: 10000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    const dialogRef = this.dialog.open(AgingDocumentsDialogComponent, {
      width: '1000px',
      maxWidth: 'none',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: {
        ticketingDetails: this.ticketData,
        mode: passMode,
        categories: [{DocCatKey: '0', Descr: 'GENERAL'}],
        agingKey: this.currentDebtorRelationship?.AgingKey || 0,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // clean relationship documents cache
      this.cacheService.removeByPattern('api/getRelationshipDocumentList?');
    });
  }
  
  // Helper methods for debtor performance calculator
  private toNum(v: any): number {
    return v === "" || v == null ? NaN : Number(v);
  }

  private fmtPct(x: number): string {
    if (isNaN(x)) return "—";
    return (Math.round(x * 1000) / 10).toFixed(1) + "%";
  }

  private fmtAmt(x: number): string {
    if (isNaN(x)) return "—";
    return new Intl.NumberFormat().format(Math.round(x));
  }

  private monthsSinceYYYYMM(ym: string): number {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return NaN;
    const [y, m] = ym.split('-').map(Number);
    const now = new Date();
    return (now.getFullYear() - y) * 12 + ((now.getMonth() + 1) - m);
  }

  private freshnessLabel(months: number): string {
    const CONFIG = { freshness: { currentMax: 1, staleMax: 3 } };
    if (isNaN(months)) return 'NA';
    if (months <= CONFIG.freshness.currentMax) return 'Current';
    if (months <= CONFIG.freshness.staleMax) return 'Stale';
    return 'Dormant';
  }

  private sum(arr: any[], key: string, start: number, len: number): number {
    let s = 0;
    for (let i = start; i < start + len && i < arr.length; i++) {
      s += (isNaN(arr[i][key]) ? 0 : arr[i][key]);
    }
    return s;
  }

  private avg(arr: any[], key: string, start: number, len: number): number {
    let n = 0, s = 0;
    for (let i = start; i < start + len && i < arr.length; i++) {
      if (!isNaN(arr[i][key])) {
        n++;
        s += arr[i][key];
      }
    }
    return n ? s / n : NaN;
  }

  // Method to check if all required data is loaded and calculate performance
  private checkAndCalculatePerformance(): void {
    if (this.debtorDetailsLoaded && this.trendData2Loaded && this.debtorDetails) {
      console.log('All required data loaded, calculating debtor performance');
      this.performanceResults = this.calculateDebtorPerformance();
      this.cdr.detectChanges();
    } else {
      console.log('Waiting for data to load:', {
        debtorDetailsLoaded: this.debtorDetailsLoaded,
        trendData2Loaded: this.trendData2Loaded,
        debtorDetails: !!this.debtorDetails
      });
    }
  }

  // Debtor Performance Calculator - Updated with new formulas
  calculateDebtorPerformance(): any {
    // Extract credit profile values
    const limit = this.toNum(this.debtorDetails?.TotalCreditLimit);
    const aigLimit = this.toNum(this.debtorDetails?.AIGLimit);
    const ob = this.toNum(this.debtorDetails?.Balance);
    const rating = this.debtorDetails?.CalcRateCode || "";

    // Extract aging trend values
    const nt = this.toNum(this.debtorDetails?.Terms) || 30;
    const dso30 = this.toNum(this.debtorDetails?.DSO30);
    const dso60 = this.toNum(this.debtorDetails?.DSO60);
    const dso90 = this.toNum(this.debtorDetails?.DSO90);
    const asofAnalytics = this.debtorDetails?.LastPmtDate ? this.debtorDetails.LastPmtDate.substring(0, 7) : "";

    // Calculate Past Due AR % and Dispute %
    const debtorName = (this.switchedDebtorType === 'N/A' ? this.originalDebtorType : this.switchedDebtorType === 'Master') ? 'Master Debtor' : this.debtorDetails?.Debtor;
    const totalPastDue = this.getTotalPastDueByDebtorName(debtorName);
    const pastDueRatio = ob > 0 ? parseFloat(totalPastDue.replace(/[,$]/g, '')) / ob : 0;
    const disputeRatio = this.toNum(this.debtorDetails?.DisputesPct) / 100 || 0; // Convert percentage to decimal

    // Extract AR Aging data from debtorDetails
    const a0 = this.toNum(this.debtorDetails?.Age0to30) || 0;
    const a1 = this.toNum(this.debtorDetails?.Age31to60) || 0;
    const a2 = this.toNum(this.debtorDetails?.Age61to90) || 0;
    const a3 = (this.toNum(this.debtorDetails?.Age91to120) || 0) + 
               (this.toNum(this.debtorDetails?.Age121to150) || 0) + 
               (this.toNum(this.debtorDetails?.Age151to180) || 0) + 
               (this.toNum(this.debtorDetails?.AgeOver180) || 0);
    
    // Calculate AR Aging As-of date - use the most recent aging date from agingData if available
    let asofAging = "";
    if (this.agingData && this.agingData.length > 0) {
      const sortedAging = this.agingData.sort((a: any, b: any) => new Date(b.InvDate).getTime() - new Date(a.InvDate).getTime());
      asofAging = sortedAging[0].InvDate ? sortedAging[0].InvDate.substring(0, 7) : "";
    }

    // Extract Payment History & Trend data - SORT BY DATE DESCENDING
    const rows = this.ticketingTrendDataSource2.data
      .sort((a: any, b: any) => {
        // Sort by YearMonth in descending order (newest first)
        return b.YearMonth.localeCompare(a.YearMonth);
      })
      .map((item: any) => ({
        month: item.YearMonth,
        pur: this.toNum(item.Purchases),
        pay: this.toNum(item.Payments),
        days: this.toNum(item.AvgWeightedDays)
      }))
      .filter((r: any) => r.month || !isNaN(r.days));

    // Console log all data used for calculating results
    console.log('=== DEBTOR PERFORMANCE CALCULATION DATA ===');
    console.log('Credit Profile:', {
      limit,
      aigLimit,
      tradeInsurance: aigLimit > 0 ? 'Yes' : 'No',
      ob,
      rating
    });
    console.log('Aging Trend:', {
      nt,
      dso30,
      dso60,
      dso90,
      asofAnalytics,
      pastDueRatio,
      disputeRatio
    });
    console.log('AR Aging (Amounts):', {
      '0-30': a0,
      '31-60': a1,
      '61-90': a2,
      '90+': a3,
      totalAge: a0 + a1 + a2 + a3,
      asofAging
    });
    console.log('AR Aging Raw Data:', {
      Age0to30: this.debtorDetails?.Age0to30,
      Age31to60: this.debtorDetails?.Age31to60,
      Age61to90: this.debtorDetails?.Age61to90,
      Age91to120: this.debtorDetails?.Age91to120,
      Age121to150: this.debtorDetails?.Age121to150,
      Age151to180: this.debtorDetails?.Age151to180,
      AgeOver180: this.debtorDetails?.AgeOver180
    });
    console.log('Payment History:', rows);
    console.log('=======================================');

    // Calculate freshness
    const latestMonth = rows.length ? rows.map(r => r.month).find(m => /^\d{4}-\d{2}$/.test(m)) : "";
    const fTrend = this.freshnessLabel(this.monthsSinceYYYYMM(latestMonth));
    const fAging = this.freshnessLabel(this.monthsSinceYYYYMM(asofAging));
    const fAnalytics = this.freshnessLabel(this.monthsSinceYYYYMM(asofAnalytics));

    // Calculate payment trend metrics
    const l3Days = this.avg(rows, "days", 0, 3);
    const p3Days = this.avg(rows, "days", 3, 3);
    const l3Pur = this.sum(rows, "pur", 0, 3);
    const l3Pay = this.sum(rows, "pay", 0, 3);

    // Predictive signals
    let quality = "NA", direction = "NA";
    if (!isNaN(l3Days) && !isNaN(nt) && !isNaN(l3Pur) && !isNaN(l3Pay)) {
      if (l3Pay >= l3Pur && l3Days <= nt + 10) quality = "Good";
      else if (l3Pay >= 0.8 * l3Pur && l3Days <= nt + 20) quality = "Fair";
      else quality = "Poor";
    }
    if (!isNaN(l3Days) && !isNaN(p3Days)) {
      if (l3Days < p3Days - 3) direction = "Improving";
      else if (Math.abs(l3Days - p3Days) <= 3) direction = "Stable";
      else direction = "Worsening";
    }

    // Utilization & availability
    let util = NaN, avail = NaN;
    if (!isNaN(limit) && limit > 0 && !isNaN(ob)) {
      util = ob / limit;
      avail = 1 - util;
    }

    // Aging Trend
    let ag = "NA", avgD = NaN, delta = NaN;
    if (!isNaN(nt)) {
      if (isNaN(dso30) || isNaN(dso60) || isNaN(dso90)) {
        ag = "NA";
      } else {
        avgD = (dso30 + dso60 + dso90) / 3;
        delta = avgD - nt;
        if (avgD <= nt + 10) ag = "Stable";
        else if (avgD <= nt + 20) ag = "Deteriorating";
        else ag = "High risk";
      }
    }

    // Baseline AR
    let prBase = "NA", eprobBase = NaN, eamtBase = NaN;
    const totalAge = (a0 + a1 + a2 + a3);
    if (totalAge > 0) {
      eamtBase = (a0 * 0.05 + a1 * 0.25 + a2 * 0.50 + a3 * 1.0);
      eprobBase = eamtBase / totalAge;
      if (eprobBase <= 0.10) prBase = "Stable";
      else if (eprobBase <= 0.25) prBase = "Deteriorating";
      else if (eprobBase <= 0.50) prBase = "Deteriorating";
      else prBase = "High risk";
    }

    // Predictive AR
    let prPred = "NA", eprobPred = NaN, eamtPred = NaN;
    const havePredictive = (!isNaN(nt) && !isNaN(l3Days) && !isNaN(l3Pur) && !isNaN(l3Pay) && quality !== "NA" && direction !== "NA");
    let predNote = "";
    if (totalAge > 0 && havePredictive) {
      const pRatio = l3Pur > 0 ? (l3Pay / l3Pur) : NaN;
      const dlt = isNaN(l3Days) || isNaN(nt) ? NaN : (l3Days - nt);
      const f_delta = isNaN(dlt) ? 1.0 : (dlt <= 10 ? 1.00 : (dlt <= 20 ? 1.10 : 1.25));
      const f_quality = quality === "Good" ? 0.95 : quality === "Fair" ? 1.00 : quality === "Poor" ? 1.10 : 1.00;
      const f_direction = direction === "Improving" ? 0.95 : direction === "Stable" ? 1.00 : direction === "Worsening" ? 1.10 : 1.00;
      const f_velocity = isNaN(pRatio) ? 1.0 : Math.min(1.3, 1 + 0.5 * Math.max(0, 1 - pRatio));
      const m = f_delta * f_quality * f_direction * f_velocity;
      const w0 = Math.min(1.50, 0.05 * m);
      const w1 = Math.min(1.50, 0.25 * m);
      const w2 = Math.min(1.20, 0.50 * m);
      const w3 = 1.00;
      eamtPred = a0 * w0 + a1 * w1 + a2 * w2 + a3 * w3;
      eprobPred = eamtPred / totalAge;
      if (eprobPred <= 0.10) prPred = "Stable";
      else if (eprobPred <= 0.25) prPred = "Deteriorating";
      else if (eprobPred <= 0.50) prPred = "Deteriorating";
      else prPred = "High risk";
    } else {
      predNote = " (Predictive NA: insufficient inputs)";
    }

    // Payment Trend rating
    let pt = "NA";
    if (!isNaN(l3Days) && !isNaN(nt) && !isNaN(l3Pur) && !isNaN(l3Pay)) {
      if (l3Days <= nt + 10) pt = "Stable";
      else if (l3Days <= nt + 20) pt = "Deteriorating";
      else pt = "High risk";
    }

    // Section & overall (using Predictive mode)
    const arRating = prPred !== "NA" ? prPred : prBase;
    let overall = "NA";
    const anyHR = [ag, arRating, pt].includes("High risk");
    const anyDet = [ag, arRating, pt].includes("Deteriorating");
    const anyNA = [ag, arRating, pt].includes("NA");
    
    if (anyHR) overall = "High risk";
    else if (anyNA) overall = "NA";
    else if (anyDet) overall = "Deteriorating";
    else overall = "Stable";

    // Overrides
    const anyDormant = [fTrend, fAging, fAnalytics].includes("Dormant");
    const anyStale = [fTrend, fAging, fAnalytics].includes("Stale");
    if (anyDormant) {
      if (totalAge > 0 && (a3 > 0 || (eprobBase > 0.5))) overall = "High risk (Dormant)";
      else overall = "NA (Dormant)";
    }

    let action = "Manual review required (insufficient or stale data)";
    if (overall.startsWith("High risk")) action = "Hold credit / Manual review";
    else if (overall === "Deteriorating") action = "Tighten terms / Review limits";
    else if (overall.startsWith("Stable")) action = "Continue credit";

    let reason = `Aging:${ag} | AR Prob(Predictive):${arRating || "NA"} | Pay Trend:${pt}`;
    reason += ` | Data Reliability:${fTrend}/${fAging}/${fAnalytics}`;
    if (anyStale && !anyDormant) reason += " (refresh within 7 days)";

    // Return the results in the new format
    return {
      overallRating: overall,
      suggestedAction: action,
      utilization: this.fmtPct(util),
      availability: this.fmtPct(avail),
      dataReliability: {
        trend: fTrend,
        arAging: fAging,
        analytics: fAnalytics
      },
      reason: reason,
      sectionRatings: {
        aging: ag,
        arProb: arRating,
        payTrend: pt
      },
      paymentTrendQuality: quality,
      trendDirection: direction,
      // Additional detailed data for debugging/display
      rawData: {
        creditProfile: { limit, aigLimit, ob, rating },
        agingTrend: { nt, dso30, dso60, dso90, pastDueRatio, disputeRatio },
        arAging: { 
          a0, a1, a2, a3, 
          totalAge: a0 + a1 + a2 + a3,
          asofAging,
          source: 'debtorDetails aging buckets'
        },
        paymentHistory: { l3Days, p3Days, l3Pur, l3Pay }
      }
    };
  }

  // method to create combined line chart, use the date of debtorDetails 
  createCombinedLineChart() {
    if (!this.combinedLineChartCanvas) {
      console.warn('Combined line chart canvas not initialized');
      return;
    }
    const ctx = this.combinedLineChartCanvas.nativeElement.getContext('2d');

    if (this.combinedLineChart) {
      this.combinedLineChart.destroy();
    }
    this.combinedLineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.combinedLineChartData.columns,
        datasets: [
          {
            label: 'Purchases',
            data: this.combinedLineChartData.rows['Purchases'],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            yAxisID: 'y',
          },
          {
            label: 'Payments',
            data: this.combinedLineChartData.rows['Payments'],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            yAxisID: 'y',
          },
          {
            label: 'Average Weighted Days',
            data: this.combinedLineChartData.rows['AverageWeightedDays'],
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgb(255, 206, 86)',
            yAxisID: 'y1',
            type: 'line',
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
              drawOnChartArea: true,
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: false,
            grace: '5%',
            min: 0,
            border: {
              color: 'rgb(255, 206, 86)'
            },
            ticks: {
              color: 'rgb(255, 206, 86)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        // plugins: {
        //   title: {
        //     // change size of the title
        //     font: {
        //       size: 14,
        //       weight: 'bold',
        //     },
        //     display: true,
        //     text: 'Months Combined Trend Chart',
        //   }
        // }
      }
    });
  }

  // function for fetching api data for the combined line chart
  loadCombinedLineChartData(passDebtorKey: string) {
    const ClientNo = '';
    const DebtorKey = parseInt(passDebtorKey);
    const trendPeriodChar = 'M';

    this.dataService.getDebtorClientTrendData(DebtorKey, ClientNo, trendPeriodChar).subscribe(response => {
      let recentPeriods = this.combinedLineChartData.columns;
      let PurchasesTempData: number[] = [];
      let PaymentsTempData: number[] = [];
      let AverageTempData: number[] = [];
      let InvoicesTempData: number[] = [];
      let AvgWeightedDaysTempData: number[] = [];
      for (let it of recentPeriods) {
        let found = false;
        for (let item of response.data) {
          if (item.YearMonth === it) {
            PurchasesTempData.push(parseFloat(item.Purchases));
            PaymentsTempData.push(parseFloat(item.Payments));
            AverageTempData.push(parseFloat(item.PurchasesAvg));
            InvoicesTempData.push(parseFloat(item.PurchasesNo));
            AvgWeightedDaysTempData.push(parseFloat(item.AvgWeightedDays));
            found = true;
            break;
          }
        }
        if (!found) {
          PurchasesTempData.push(0);
          PaymentsTempData.push(0);
          AverageTempData.push(0);
          InvoicesTempData.push(0);
          AvgWeightedDaysTempData.push(0);
        }
      }
      this.combinedLineChartData.rows['Purchases'] = PurchasesTempData;
      this.combinedLineChartData.rows['Payments'] = PaymentsTempData;
      this.combinedLineChartData.rows['Average'] = AverageTempData;
      this.combinedLineChartData.rows['Invoices'] = InvoicesTempData;
      this.combinedLineChartData.rows['AverageWeightedDays'] = AvgWeightedDaysTempData;

      if (this.combinedLineChartCanvas && this.combinedLineChartCanvas.nativeElement) {
        this.createCombinedLineChart();
        this.cdr.detectChanges(); // Trigger change detection
      }
      // deleyed loading of the chart
      else {
        setTimeout(() => {
          this.createCombinedLineChart();
          this.cdr.detectChanges(); // Trigger change detection
        }, 500);
      }

    });
  }

  // eventhandler for selecting menu to switch debtor
  onSwitchDebtorClick(selectedDebtorKey: string) {
    this.switchedDebtorKey = selectedDebtorKey;
    // search and save alert if debtor is in alert list
    this.debtorAlert = this.debtorAlertsList.find(alert => alert.DebtorKey === selectedDebtorKey) || {};
    // load new debtor details
    // let sumBalance = 0; // sumBalance is already calculated when initializing the pageand stored in allRelatedDebtors
    let isMasterflag = false;
    for (let it of this.allRelatedDebtors) {
      if (it.DebtorKey === selectedDebtorKey) {
        this.debtorDetails = it;
        isMasterflag = it.MasterDebtorKey === '0';
      }
      // sumBalance += Number(it.Balance) || 0;
    }
    // if it is master debtor, update the balance to sum of all related debtors
    if (isMasterflag) {
      // this.debtorDetails.Balance = '' + sumBalance;
      this.switchedDebtorType = 'Master';
    }
    else {
      this.switchedDebtorType = 'Member';
    }

    this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
    console.log('ticketing-analysis-component, Switched, this.debtorDetails:', this.debtorDetails);

    // Reset loading flags and wait for new trend data to load
    this.debtorDetailsLoaded = true;
    this.trendData2Loaded = false;
    this.performanceResults = null;

    this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
    this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2

    // fetch client concentration percentage
    this.searchAllClientsByDebtorKey(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));
    // fetch debtor concentration percentage
    this.loadDebtorConcentrationPercentage(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));

    // load alternate addresses
    this.getDebtorAlternateAddresses(this.debtorDetails.DebtorKey);

    // load combined line chart data
    this.loadCombinedLineChartData(this.debtorDetails.DebtorKey);

    // load the no buy code
    this.setDefaultNoBuyCode();

    this.cdr.detectChanges(); // Trigger change detection

  }

  // eventhandler for clearing the switched debtor and go back to original
  onResetSwitchDebtor() {
    // search and save alert if debtor is in alert list
    this.debtorAlert = this.debtorAlertsList.find(alert => alert.DebtorKey === this.ticketData.DebtorKey) || {};

    this.switchedDebtorKey = '';
    this.switchedDebtorType = 'N/A';
    // let sumBalance = 0;
    let isMasterflag = false;
    for (let it of this.allRelatedDebtors) {
      if (it.DebtorKey === this.ticketData.DebtorKey) {
        this.debtorDetails = it;
        isMasterflag = it.MasterDebtorKey === '0';
      }
      // sumBalance += Number(it.Balance) || 0;
    }
    // if it is master debtor, update the balance to sum of all related debtors
    // if (isMasterflag) {
    //   this.debtorDetails.Balance = '' + sumBalance;
    // }

    this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
    console.log('ticketing-analysis-component, Reseted, this.debtorDetails:', this.debtorDetails);

    // Reset loading flags and wait for new trend data to load
    this.debtorDetailsLoaded = true;
    this.trendData2Loaded = false;
    this.performanceResults = null;

    this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
    this.loadTrendDialogData(parseInt(this.debtorDetails.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2

    // fetch client concentration percentage
    this.searchAllClientsByDebtorKey(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));
    // fetch debtor concentration percentage
    this.loadDebtorConcentrationPercentage(parseInt(this.debtorDetails.DebtorKey), parseInt(this.ticketData.ClientKey));

    // load alternate addresses
    this.getDebtorAlternateAddresses(this.debtorDetails.DebtorKey);

    // load combined line chart data
    this.loadCombinedLineChartData(this.debtorDetails.DebtorKey);

    // load the no buy code
    this.setDefaultNoBuyCode();

    this.cdr.detectChanges(); // Trigger change detection

  }

  // method to get debtor's alternate addresses by DebtorKey
  getDebtorAlternateAddresses(debtorKey: number) {
    this.dataService.getDebtorAlternateAddresses(debtorKey).subscribe(response => {
      this.alternateAddresses = response.data;
      // console.log('alternateAddresses--', this.alternateAddresses);
      // console.log('formatted alternateAddresses--', this.formatAlternateAddress());
      this.cdr.detectChanges(); // Trigger change detection
    }, error => {
      console.error('Error fetching debtor alternate addresses:', error);
    });
  }

  // method to convert address array to formatted address string
  formatAlternateAddress(): string {
    let result = '';
    let addresses = this.alternateAddresses;
    for (let i = 0; i < addresses.length; i++) {
      result += addresses[i].Name + '; ' + this.formatAddress([addresses[i].Addr1, addresses[i].Addr2, addresses[i].City, addresses[i].State, addresses[i].Country, addresses[i].ZipCode]);
      if (i < addresses.length - 1) {
        result += "\n";
      }
    }
    return result;
  }

  // method to delete an alternate address
  deleteAlternateAddress() {
    if (!this.alternateAddresses || this.alternateAddresses.length === 0) {
      Swal.fire('No Addresses', 'There are no alternate addresses to delete.', 'info');
      return;
    }

    // Create HTML for the address list with checkboxes
    let addressListHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';

    this.alternateAddresses.forEach((address, index) => {
      const formattedAddress = address.Name + ';' + this.formatAddress([
        address.Addr1,
        address.Addr2,
        address.City,
        address.State,
        address.Country,
        address.ZipCode
      ]);

      addressListHtml += `
      <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <label style="display: flex; align-items: flex-start; cursor: pointer;">
          <input type="checkbox" 
                 id="address_${index}" 
                 class="address-delete-checkbox"
                 value="${address.AltAddressKey}" 
                 style="margin-right: 10px; margin-top: 5px; transform: scale(1.2);">
          <div>
            <span style="color: #333; font-size: 14px;">${formattedAddress || 'No address available'}</span>
          </div>
        </label>
      </div>
    `;
    });

    addressListHtml += '</div>';

    Swal.fire({
      title: 'Delete Alternate Addresses',
      html: `
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 15px; color: #666;">Select the alternate addresses you want to delete:</p>
        ${addressListHtml}
      </div>
    `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Delete Selected',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      preConfirm: () => {
        // Get all checked checkboxes
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"].address-delete-checkbox:checked');
        const selectedIndices: number[] = [];

        checkedBoxes.forEach((checkbox) => {
          const keyNumber = parseInt((checkbox as HTMLInputElement).value);
          selectedIndices.push(keyNumber);
        });

        if (selectedIndices.length === 0) {
          Swal.showValidationMessage('Please select at least one address to delete');
          return false;
        }

        return selectedIndices;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const selectedIndices = result.value as number[];

        Swal.fire({
          title: 'Confirm Deletion',
          html: `
          <p>Are you sure you want to delete the selected alternate address(es)?</p>
          <p style="color: #666; font-size: 14px;">This action cannot be undone.</p>
        `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Delete',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6'
        }).then((confirmResult) => {
          if (confirmResult.isConfirmed) {
            this.performDeleteAlternateAddresses(selectedIndices);
            // console.log('Selected indices to delete:', selectedIndices);
          }
        });
      }
    });
  }

  // Helper method to perform the actual deletion
  private performDeleteAlternateAddresses(selectedIndices: number[]) {
    // Create an array of API calls for each address to delete
    const deletePromises = selectedIndices.map(keyNumber => {
      // Replace this with your actual API call
      return this.dataService.deleteDebtorAlternateAddress(this.debtorDetails.DebtorKey, keyNumber, this.currentUser).toPromise();
    });

    // Show loading indicator
    Swal.fire({
      title: 'Deleting Addresses...',
      text: 'Please wait while we delete the selected addresses.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // Execute all delete operations
    Promise.all(deletePromises)
      .then(() => {
        // Clear cache and reload alternate addresses
        this.cacheService.removeByPattern('/api/getDebtorAlternateAddresses?');
        this.getDebtorAlternateAddresses(this.debtorDetails.DebtorKey);

        // close loading indicator
        Swal.close();
        // Show success snackbar
        this._snackBar.openFromComponent(SuccessSnackbarComponent, {
          data: { message: `${selectedIndices.length} alternate address(es) deleted successfully` },
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      })
      .catch((error) => {
        console.error('Error deleting alternate addresses:', error);

        // close loading indicator
        Swal.close();
        // Show error snackbar
        this._snackBar.openFromComponent(ErrorSnackbarComponent, {
          data: { message: "Error deleting alternate addresses: " + (error.error?.message || error.message) },
          duration: 10000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      });
  }

  // method to add an alternate address
  addAlternateAddress() {
    if (!this.countryAreaList || this.countryAreaList.length === 0) {
      Swal.fire('Error', 'Country list not loaded. Please try again later.', 'error');
      return;
    }

    // Create country dropdown options
    let countryOptionsHtml = '<option value="">Select Country</option>';
    this.countryAreaList.forEach(country => {
      countryOptionsHtml += `<option value="${country.CountryAreaName}">${country.CountryAreaName}</option>`;
    });

    Swal.fire({
      title: 'Add Alternate Address',
      html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label for="swal-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Name *</label>
          <input id="swal-name" class="swal2-input" placeholder="Enter name" style="width: 90%; margin: 0;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="swal-addr1" style="display: block; margin-bottom: 5px; font-weight: bold;">Address Line 1</label>
          <input id="swal-addr1" class="swal2-input" placeholder="Enter address line 1" style="width: 90%; margin: 0;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="swal-addr2" style="display: block; margin-bottom: 5px; font-weight: bold;">Address Line 2</label>
          <input id="swal-addr2" class="swal2-input" placeholder="Enter address line 2 (optional)" style="width: 90%; margin: 0;">
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label for="swal-city" style="display: block; margin-bottom: 5px; font-weight: bold;">City</label>
            <input id="swal-city" class="swal2-input" placeholder="Enter city" style="width: 90%; margin: 0;">
          </div>
          <div style="flex: 1;">
            <label for="swal-state" style="display: block; margin-bottom: 5px; font-weight: bold;">State/Province</label>
            <input id="swal-state" class="swal2-input" placeholder="Enter state" style="width: 90%; margin: 0;">
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label for="swal-zipcode" style="display: block; margin-bottom: 5px; font-weight: bold;">Zip/Postal Code</label>
            <input id="swal-zipcode" class="swal2-input" placeholder="Enter zip code" style="width: 90%; margin: 0;">
          </div>
          <div style="flex: 1;">
            <label for="swal-country" style="display: block; margin-bottom: 5px; font-weight: bold;">Country</label>
            <select id="swal-country" class="swal2-input" style="width: 90%; margin: 0;">
              ${countryOptionsHtml}
            </select>
          </div>
        </div>
        
        <div style="margin-top: 10px; color: #666; font-size: 12px;">
          * Required fields
        </div>
      </div>
    `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Add Address',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim();
        const addr1 = (document.getElementById('swal-addr1') as HTMLInputElement).value.trim();
        const addr2 = (document.getElementById('swal-addr2') as HTMLInputElement).value.trim();
        const city = (document.getElementById('swal-city') as HTMLInputElement).value.trim();
        const state = (document.getElementById('swal-state') as HTMLInputElement).value.trim();
        const zipCode = (document.getElementById('swal-zipcode') as HTMLInputElement).value.trim();
        const country = (document.getElementById('swal-country') as HTMLSelectElement).value;

        // Validation
        if (!name) {
          Swal.showValidationMessage('Name is required');
          return false;
        }
        console.log('name:', name, ' addr1:', addr1, ' city:', city, ' state:', state, ' zipCode:', zipCode, ' country:', country);

        return {
          name: name,
          addr1: addr1,
          addr2: addr2,
          city: city,
          state: state,
          zipCode: zipCode,
          country: country
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const addressData = result.value;

        // Show confirmation dialog
        const formattedAddress = this.formatAddress([
          addressData.addr1,
          addressData.addr2,
          addressData.city,
          addressData.state,
          addressData.country,
          addressData.zipCode
        ]);

        Swal.fire({
          title: 'Confirm Addition',
          html: `
          <p>Are you sure you want to add this alternate address?</p>
          <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; text-align: left;">
            <span style="color: #666;">${addressData.name}; ${formattedAddress}</span>
          </div>
        `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Add',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#6c757d'
        }).then((confirmResult) => {
          if (confirmResult.isConfirmed) {
            this.performAddAlternateAddress(addressData);
          }
        });
      }
    });
  }

  // Helper method to perform the actual addition
  private performAddAlternateAddress(addressData: any) {
    // Show loading indicator
    Swal.fire({
      title: 'Adding Address...',
      text: 'Please wait while we add the alternate address.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // Call the API to add the alternate address
    this.dataService.addDebtorAlternateAddress(
      parseInt(this.debtorDetails.DebtorKey),
      addressData.name,
      addressData.addr1,
      addressData.addr2,
      addressData.city,
      addressData.state,
      addressData.zipCode,
      addressData.country,
      this.currentUser
    ).subscribe({
      next: (response) => {
        // Clear cache and reload alternate addresses
        this.cacheService.removeByPattern('/api/getDebtorAlternateAddresses?');
        this.getDebtorAlternateAddresses(this.debtorDetails.DebtorKey);

        // Close loading indicator
        Swal.close();

        // Show success snackbar
        this._snackBar.openFromComponent(SuccessSnackbarComponent, {
          data: { message: 'Alternate address added successfully' },
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      },
      error: (error) => {
        console.error('Error adding alternate address:', error);

        // Close loading indicator
        Swal.close();

        // Show error snackbar
        this._snackBar.openFromComponent(ErrorSnackbarComponent, {
          data: { message: "Error adding alternate address: " + (error.error?.message || error.message) },
          duration: 10000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      }
    });
  }

  // method to load country and area list
  loadCountryAreaList() {
    this.dataService.getCountryAreaList().subscribe((response: any) => {
      this.countryAreaList = response.data;
      // console.log('Country Area List:', this.countryAreaList);

      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  // Method to generate tooltip text for switchable debtors
  getDebtorTooltipText(debtor: any): string {
    const parts = [];
    // Address with icon
    parts.push(`🏠 ${debtor.FullAddress}`);
    // Phone with icon
    parts.push(`📞 ${debtor.Phone}`);
    // Email with icon
    parts.push(`📧 ${debtor.Email}`);
    // Motor Carrier Number with icon
    parts.push(`🚛 MC#: ${debtor.MotorCarrNo}`);

    return parts.join('\n');
  }

  // helper method to re-order switchable debtors list, master debtor on top, order by name
  reorderSwitchableDebtors() {
    this.switchableDebtors.sort((a, b) => {
      // Master debtor first
      if (a.isMaster && !b.isMaster) {
        return -1;
      }
      if (!a.isMaster && b.isMaster) {
        return 1;
      }
      // Then order by name
      return a.DebtorName.localeCompare(b.DebtorName);
    });
  }

  // helper method to format trend analysis table column headers
  formatTrendTableHeader(header: string): string {
    if (header.length === 7){
      let [year, month] = header.split('-');
      let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]}/${year.substring(2)}`;
    }
    else if (header.length === 6 && header !== 'Period'){
      let [year, quarter] = header.split('-');
      return `Q${quarter}/${year.substring(2)}`;
    }
    else {
      return header;
    }
  }

  // click event handler for showing debtor alert details
  onShowDebtorAlertDetails() {
    if (!this.debtorAlert || Object.keys(this.debtorAlert).length === 0) {
      console.log('No debtor alert details available');
      return;
    }

    // Parse XML data to extract meaningful information
    const alertInfo = this.parseAlertXmlData(this.debtorAlert.XmlData);
    
    // Create HTML content for the alert details
    const alertHtml = this.buildAlertDetailsHtml(this.debtorAlert, alertInfo);

    // Show SweetAlert2 dialog with the alert details
    Swal.fire({
      title: '<strong>Debtor Alert Details</strong>',
      html: alertHtml,
      // icon: 'warning',
      width: '800px',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976d2',
      customClass: {
        popup: 'debtor-alert-dialog',
        htmlContainer: 'debtor-alert-content'
      }
    });
  }

  // Helper method to parse XML alert data
  private parseAlertXmlData(xmlData: string): any {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      const alertNotification = xmlDoc.querySelector('AlertNotification');
      if (!alertNotification) return {};

      const alertInfo = {
        alertId: alertNotification.querySelector('AlertId')?.textContent || 'N/A',
        submittedDate: alertNotification.querySelector('SubmittedDate')?.textContent || 'N/A',
        industrySector: alertNotification.querySelector('IndustrySector')?.textContent || 'N/A',
        customers: [] as any[],
        alertTypes: [] as any[]
      };

      // Extract customer information (can be multiple customers)
      const customers = alertNotification.querySelectorAll('ContributorCustomer');
      customers.forEach(customer => {
        alertInfo.customers.push({
          entityId: customer.querySelector('EntityId')?.textContent || 'N/A',
          name: customer.querySelector('Name')?.textContent || 'N/A',
          address1: customer.querySelector('Address1')?.textContent || 'N/A',
          city: customer.querySelector('City')?.textContent || 'N/A',
          state: customer.querySelector('State')?.textContent || 'N/A',
          postalCode: customer.querySelector('PostalCode')?.textContent || 'N/A',
          country: customer.querySelector('Country')?.textContent || 'N/A',
          accountNumber: customer.querySelector('AccountNumber')?.textContent || 'N/A',
          matchCount: customer.querySelector('MatchCount')?.textContent || 'N/A',
          isPartnerCustomer: customer.querySelector('IsPartnerCustomer')?.textContent || 'N/A'
        });
      });

      // Extract alert types and field values
      const alertTypes = alertNotification.querySelectorAll('AlertType');
      alertTypes.forEach(alertType => {
        const alertTypeInfo = {
          alertName: alertType.querySelector('AlertName')?.textContent || 'N/A',
          fields: [] as any[]
        };

        const alertFields = alertType.querySelectorAll('AlertField');
        alertFields.forEach(field => {
          alertTypeInfo.fields.push({
            fieldName: field.querySelector('FieldName')?.textContent || 'N/A',
            fieldValue: field.querySelector('FieldValue')?.textContent || 'N/A'
          });
        });

        alertInfo.alertTypes.push(alertTypeInfo);
      });

      return alertInfo;
    } catch (error) {
      console.error('Error parsing XML data:', error);
      return {};
    }
  }

  // Helper method to format customer full address
  private formatCustomerFullAddress(customer: any): string {
    const addressParts = [];
    
    if (customer.address1 && customer.address1 !== 'N/A') {
      addressParts.push(customer.address1);
    }
    
    if (customer.city && customer.city !== 'N/A') {
      addressParts.push(customer.city);
    }
    
    if (customer.state && customer.state !== 'N/A') {
      addressParts.push(customer.state);
    }
    
    if (customer.postalCode && customer.postalCode !== 'N/A') {
      addressParts.push(customer.postalCode);
    }
    
    if (customer.country && customer.country !== 'N/A') {
      addressParts.push(customer.country);
    }
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
  }

  // Helper method to build HTML content for alert details
  private buildAlertDetailsHtml(debtorAlert: any, alertInfo: any): string {
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateStr;
      }
    };

    let html = `
      <div style="text-align: left; font-size: 14px; line-height: 1.5;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">Basic Information</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>Alert Type:</strong> ${debtorAlert.Type || 'N/A'}</div>
            <div><strong>Debtor Key:</strong> ${debtorAlert.DebtorKey || 'N/A'}</div>
            <div><strong>Company Name:</strong> ${debtorAlert.Name || 'N/A'}</div>
            <div><strong>Received Time:</strong> ${formatDate(debtorAlert.RefTime || '')}</div>
          </div>
        </div>`;

    if (alertInfo && Object.keys(alertInfo).length > 0) {
      html += `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Alert Details</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div><strong>Alert ID:</strong> ${alertInfo.alertId}</div>
            <div><strong>Submitted Date:</strong> ${formatDate(alertInfo.submittedDate)}</div>
            <div><strong>Industry Sector:</strong> ${alertInfo.industrySector}</div>
          </div>
        </div>`;

      if (alertInfo.customers && alertInfo.customers.length > 0) {
        html += `
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">Customer Information (${alertInfo.customers.length} customer${alertInfo.customers.length > 1 ? 's' : ''})</h4>`;
        
        alertInfo.customers.forEach((customer: any, index: number) => {
          html += `
            <div style="margin-bottom: ${index < alertInfo.customers.length - 1 ? '20px' : '0'}; ${index > 0 ? 'border-top: 1px solid #ccc; padding-top: 15px;' : ''}">
              ${alertInfo.customers.length > 1 ? `<h5 style="color: #1976d2; margin: 0 0 10px 0; font-size: 14px;">Customer ${index + 1}</h5>` : ''}
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>Name:</strong> ${customer.name}</div>
                <div><strong>Account Number:</strong> ${customer.accountNumber}</div>
                <div style="grid-column: 1 / -1;"><strong>Full Address:</strong> ${this.formatCustomerFullAddress(customer)}</div>
              </div>
            </div>`;
        });
        
        html += `</div>`;
      }
      else {
        html += `
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">Customer Information</h4>
            <div>No customer information available.</div>
          </div>`;
      }

      if (alertInfo.alertTypes && alertInfo.alertTypes.length > 0) {
        html += `
          <div style="background: #f8d7da; padding: 15px; border-radius: 8px;">
            <h4 style="color: #721c24; margin: 0 0 10px 0; font-size: 16px;">Alert(s)</h4>`;
        
        alertInfo.alertTypes.forEach((alertType: any, index: number) => {
          html += `
            <div style="margin-bottom: ${index < alertInfo.alertTypes.length - 1 ? '15px' : '0'};">
              <div style="font-weight: bold; color: #721c24; margin-bottom: 8px;">
                ${alertType.alertName}
              </div>`;
          
          if (alertType.fields && alertType.fields.length > 0) {
            html += `<div style="margin-left: 20px;">`;
            alertType.fields.forEach((field: any) => {
              html += `
                <div style="margin-bottom: 5px;">
                  <strong>${field.fieldName}:</strong> <span style="color: #721c24;">${field.fieldValue}</span>
                </div>`;
            });
            html += `</div>`;
          }
          html += `</div>`;
        });
        
        html += `</div>`;
      }
      else {
        html += `
          <div style="background: #f8d7da; padding: 15px; border-radius: 8px;">
            <h4 style="color: #721c24; margin: 0 0 10px 0; font-size: 16px;">Alert(s)</h4>
            <div>No alert available.</div>
          </div>`;
      }
    }

    html += `</div>`;
    return html;
  }

  // method to filter and calculate aging data, to get debtors total past due balance
  getDebtorsTotalPastDueBalance(): void {
    const tempDebtorsTotalPastDue: {'Debtor': string, 'TotalPastDue': number}[] = [];
    const netTerms = parseInt(this.debtorDetails?.NetTerms || '30');
    let masterPastDue = 0;
    for (let it of this.agingData) {
      if (it.Status === 'Open' && parseInt(it.Age) > netTerms) {
        masterPastDue += parseFloat(it.Balance);
        const existing = tempDebtorsTotalPastDue.find(d => d.Debtor === it.DtrName);
        if (existing) {
          existing.TotalPastDue += parseFloat(it.Balance);
        } else {
          tempDebtorsTotalPastDue.push({ Debtor: it.DtrName, TotalPastDue: parseFloat(it.Balance) });
        }
      }
    }
    tempDebtorsTotalPastDue.push({ Debtor: 'Master Debtor', TotalPastDue: masterPastDue });
    this.debtorsTotalPastDue = tempDebtorsTotalPastDue;
    // console.log('tempDebtorsTotalPastDue--', tempDebtorsTotalPastDue);
  }

  // helper method to return debtor's total past due balance by debtor name
  getTotalPastDueByDebtorName(debtorName: string): string {
    if (this.debtorsTotalPastDue.length === 0) {
      return '0.00';
    }
    else {
      const debtorData = this.debtorsTotalPastDue.find(d => d.Debtor === debtorName);
      if (debtorData) {
        return '' + debtorData.TotalPastDue;
      }
      else {
        return '0.00';
      }
    }
  }


}
