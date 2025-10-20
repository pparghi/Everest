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
    // this.ticketData = this.data; // removebecause the data is used by dialog

    this.originalDebtorKey = this.ticketData.DebtorKey;
    this.originalDebtorType = this.ticketData.Type;

    let tempDebtorKey: string;

    // Get the logged in user for CredAppBy
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      this.currentUser = (profile as any).mail.match(/^([^@]*)@/)[1];
      
      // fetch debtor details
      if (this.ticketData.DebtorKey) {
        this.memberDebtorsService.getMemberDebtors(parseInt(this.ticketData.DebtorKey)).subscribe(response => {
          this.debtorDetails = response.data[0];
          let sumBalance = 0;
          for (let it of response.data) {
            sumBalance += Number(it.Balance) || 0;
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
                isMaster: (this.originalDebtorKey === it.DebtorKey ? true : false)
              });
            }
          }
          // if the debtor type is Master, set the balance to sum of all member debtors
          if (this.originalDebtorType === 'Master'){
            this.debtorDetails.Balance = '' + sumBalance;
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
                  isMaster: (tempDebtorKey === it.DebtorKey ? true : false)
                });
              }
              for (let it of this.switchableDebtors) {
                if (it.DebtorKey === tempDebtorKey) {
                  it.TotalAR = sumBalance;
                }
              }
            });
          }

          this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
          console.log('ticketing-analysis-component, this.debtorDetails:', this.debtorDetails);
          
          // Emit the debtor details to the parent component
          this.debtorDetailsChanged.emit(this.debtorDetails);
          
          // fetch no buy code list and set the default no buy code after debtor details are loaded
          this.getNoBuyCodeList();
          
          // Calculate debtor performance after debtor details are loaded
          this.performanceResults = this.calculateDebtorPerformance();
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
      console.log('Trend Data:', this.ticketingTrendDataSource.data);
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
      }

    });
  }

  // load concentration percentage number of a client related to a debtor
  searchAllClientsByDebtorKey(DebtorKey: number, ClientKey: number): void {
    this.clientService.getClients(DebtorKey).subscribe(response => {
      console.log("ticketing-analysis-component, getClients by debtorKey: ", response.data);

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
        
        // Calculate debtor performance after debtor details are loaded
        this.performanceResults = this.calculateDebtorPerformance();

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
  
  // Debtor Performance Calculator
  calculateDebtorPerformance(): any {
    // Extract values from component data using the mapping
    const cl = parseFloat(this.debtorDetails?.TotalCreditLimit) || 0;
    const ob = parseFloat(this.debtorDetails?.Balance) || 0;
    const terms = parseFloat(this.debtorDetails?.Terms) || 30;
    const dso_all = parseFloat(this.debtorDetails?.DSOAll) || null;
    const dso30 = parseFloat(this.debtorDetails?.DSO30) || null;
    const dso60 = parseFloat(this.debtorDetails?.DSO60) || null;
    const dso90 = parseFloat(this.debtorDetails?.DSO90) || null;
    const pastDueRatio = parseFloat(this.debtorDetails?.PastDuePct) || null;
    const disputeRatio = parseFloat(this.debtorDetails?.DisputesPct) || null;
    const rating = this.debtorDetails?.CalcRateCode || "";
    const lastpay = this.debtorDetails?.LastPmtDate || null;

    // Utilization
    let util = 0;
    if (cl > 0 && ob !== null) util = ob / cl; else util = 0;

    // History vs New
    const hasDSO = (dso_all !== null) || (dso30 !== null) || (dso60 !== null) || (dso90 !== null);
    const hasHistory = (!!lastpay && hasDSO);
    const isNew = (!lastpay && !hasDSO);

    // Override rule
    let override = false;
    let diffDays = 0;
    if (lastpay) {
      try {
        const lp = new Date(lastpay);
        const today = new Date();
        diffDays = Math.floor((today.getTime() - lp.getTime()) / (1000 * 60 * 60 * 24));
        override = diffDays > 45;
      } catch(e) { 
        console.error('Error calculating date difference:', e);
      }
    }

    // Points
    const dso_vs_terms = (dso_all !== null && terms !== null) ? (dso_all - terms) : null;

    const utilPts = util <= 0.7 ? 0 : (util <= 1 ? 20 : 40);
    const dsoPts = (dso_vs_terms === null) ? 0 : (dso_vs_terms <= 0 ? 0 : (dso_vs_terms <= 15 ? 10 : (dso_vs_terms <= 30 ? 20 : 40)));
    const pastPts = (pastDueRatio === null) ? 0 : (pastDueRatio < 0.10 ? 0 : (pastDueRatio <= 0.25 ? 20 : 40));
    const dispPts = (disputeRatio === null) ? 0 : (disputeRatio < 0.05 ? 0 : (disputeRatio <= 0.10 ? 10 : 20));
    
    let ratePts = 0;
    if (rating === "A") ratePts = 0; 
    else if (rating === "B") ratePts = 10; 
    else if (rating === "C") ratePts = 20; 
    else if (rating === "D") ratePts = 40;
    
    const overlimitPts = (cl && ob && ob > cl) ? 10 : 0;

    const score = (utilPts * 0.2) + (dsoPts * 0.2) + (pastPts * 0.2) + (dispPts * 0.1) + (ratePts * 0.2) + (overlimitPts * 0.1);

    // Classification
    let klass = "N";
    if (override) { 
      klass = "Deteriorating"; 
    }
    else if (isNew) { 
      klass = "N"; 
    }
    else {
      if (score <= 10) klass = "Stable";
      else if (score <= 18) klass = "Deteriorating";
      else klass = "High Risk";
    }

    // Suggestion text & new limit
    let suggest = "—";
    let newCL = cl || 0;
    if (klass === "N") {
      const trial = (cl && cl > 0) ? Math.min(10000, cl * 0.10) : 10000;
      suggest = "Trial credit; pick Low/Moderate/High Restriction based on external refs";
      newCL = trial;
    } else if (klass === "Stable") {
      if (util >= 0.6 && util < 0.85) { suggest = "Increase 10%"; newCL = cl * 1.10; }
      else if (util >= 0.85 && util <= 1) { suggest = "Increase 15–25%"; newCL = cl * 1.20; }
      else { suggest = "No change"; newCL = cl; }
    } else if (klass === "Deteriorating") {
      suggest = "Freeze limit";
      newCL = cl;
    } else { // High Risk
      suggest = "Decrease 10–30% (or CIA)";
      newCL = cl * 0.80;
    }

    // Return the results
    return {
      status: klass,
      statusClass: klass === "Stable" ? "stable" : 
                  (klass === "Deteriorating" ? "deteriorating" : 
                  (klass === "High Risk" ? "highrisk" : "new")),
      utilization: isFinite(util) ? (Math.round(util * 1000) / 10) : 0,
      override: override ? diffDays + " days since last payment" : "N/A",
      score: (Math.round(score * 10) / 10).toFixed(1),
      suggestion: suggest,
      newCreditLimit: Math.round(newCL)
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
    // load new debtor details
    let sumBalance = 0;
    let isMasterflag = false;
    for (let it of this.allRelatedDebtors) {
      if (it.DebtorKey === selectedDebtorKey) {
        this.debtorDetails = it;
        isMasterflag = it.MasterDebtorKey === '0';
      }
      sumBalance += Number(it.Balance) || 0;
    }
    // if it is master debtor, update the balance to sum of all related debtors
    if (isMasterflag) {
      this.debtorDetails.Balance = '' + sumBalance;
      this.switchedDebtorType = 'Master';
    }
    else {
      this.switchedDebtorType = 'Member';
    }

    this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
    console.log('ticketing-analysis-component, Switched, this.debtorDetails:', this.debtorDetails);

    // Calculate debtor performance after debtor details are loaded
    this.performanceResults = this.calculateDebtorPerformance();

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
    this.switchedDebtorKey = '';
    this.switchedDebtorType = 'N/A';
    let sumBalance = 0;
    let isMasterflag = false;
    for (let it of this.allRelatedDebtors) {
      if (it.DebtorKey === this.ticketData.DebtorKey) {
        this.debtorDetails = it;
        isMasterflag = it.MasterDebtorKey === '0';
      }
      sumBalance += Number(it.Balance) || 0;
    }
    // if it is master debtor, update the balance to sum of all related debtors
    if (isMasterflag) {
      this.debtorDetails.Balance = '' + sumBalance;
    }

    this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
    console.log('ticketing-analysis-component, Reseted, this.debtorDetails:', this.debtorDetails);

    // Calculate debtor performance after debtor details are loaded
    this.performanceResults = this.calculateDebtorPerformance();

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



}
