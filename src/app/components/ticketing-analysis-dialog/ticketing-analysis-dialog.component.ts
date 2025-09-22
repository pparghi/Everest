import { ChangeDetectionStrategy, Component, Input, Inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { DecimalPipe } from '@angular/common';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from 'chart.js';
import { ClientsService } from '../../services/clients.service';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
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

    // Get the logged in user for CredAppBy
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      this.currentUser = (profile as any).mail.match(/^([^@]*)@/)[1];
      
      // fetch debtor details
      if (this.ticketData.DebtorKey) {
        this.memberDebtorsService.getMemberDebtors(parseInt(this.ticketData.DebtorKey)).subscribe(response => {
          this.debtorDetails = response.data[0];
          for (let it of response.data) {
            if (it.DebtorKey === this.ticketData.DebtorKey) {
              this.debtorDetails = it; 
              break;
            }
          }
          this.debtorDetails.CredAppBy = this.currentUser.toUpperCase(); // set the CredAppBy to current user
          console.log('ticketing-analysis-component, this.debtorDetails:', this.debtorDetails);
          
          // Emit the debtor details to the parent component
          this.debtorDetailsChanged.emit(this.debtorDetails);
          
          // fetch no buy code list and set the default no buy code after debtor details are loaded
          this.getNoBuyCodeList();
        }, error => {
          console.error('Error fetching member debtors:', error);
        });
      }
    });

    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2
  

    // fetch client concentration percentage
    this.loadClientConcentrationPercentage(parseInt(this.ticketData.DebtorKey), parseInt(this.ticketData.ClientKey));
    // fetch debtor concentration percentage
    this.loadDebtorConcentrationPercentage(parseInt(this.ticketData.DebtorKey), parseInt(this.ticketData.ClientKey));

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
      }

    });
  }

  // load concentration percentage number of a client related to a debtor
  loadClientConcentrationPercentage(DebtorKey: number, ClientKey: number): void {
    this.clientService.getClients(DebtorKey).subscribe(response => {
      console.log("client concentration number: ", response.data);
      for (let it of response.data) {
        if (parseInt(it.ClientKey) === ClientKey) {
          this.ClientConcentrationPercentage = Math.round(parseFloat(it.Concentration) * 10000) / 100 + '%';
          break;
        }
      }
    });
  }

  // load concentration percentage number of a debtor related to a client
  loadDebtorConcentrationPercentage(DebtorKey: number, ClientKey: number): void {
    this.clientsDebtorsService.getClientsDebtors(ClientKey).subscribe(response => {
      // console.log("debtor concentration number: ", response.data);
      for (let it of response.data) {
        if (parseInt(it.DebtorKey) === DebtorKey) {
          this.DebtorConcentrationPercentage = Math.round(parseFloat(it.Concentration) * 10000) / 100 + '%';
          break;
        }
      }
    });
  }

  // calculate percentage and return formatted string
  calculatePercentage(valueStr: string, totalStr: string): string {
    let total = parseFloat(totalStr);
    let value = parseFloat(valueStr);
    if (total === 0) return '0%';
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
    let tempData: TrendVerticalData[] = [{ Period: "Purchases" }, { Period: "Average" }, { Period: "Invoices" }, { Period: "Paid to zero" }, { Period: "Recoursed" }, { Period: "Avg Weighted Days" }];
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
    // if (element.Addr1) {
    //   fullAddress += element.Addr1 + ", ";
    // }
    // if (element.Addr2) {
    //   fullAddress += element.Addr2 + ", ";
    // }
    // if (element.City) {
    //   fullAddress += element.City + ", ";
    // }
    // if (element.State) {
    //   fullAddress += element.State + ", ";
    // }
    // if (element.Country) {
    //   fullAddress += element.Country + ", ";
    // }
    // if (element.ZipCode) {
    //   fullAddress += element.ZipCode;
    // }
    // fullAddress = fullAddress.trim().replace(/^,+\s*|\s*,+$/g, "");
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
    return addresses.join(', ').trim().replace(/^,+\s*|\s*,+$/g, "");
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

    // Get the logged in user for CredAppBy
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      const userId = (profile as any).mail.match(/^([^@]*)@/)[1];
      formData.append('CredAppBy', userId.toUpperCase());

      // Call the API service to update the debtor
      this.dataService.updateDebtorDetails(formData).subscribe({
        next: (response) => {
          // Clear master debtors data cache for showing updated Duns
          this.cacheService.removeByPattern('/api/memberDebtors?');

          // Show success message
          Swal.fire('Success', 'Debtor information updated successfully with DUNS data.', 'success');
          this.drawer.close(); // Close the drawer
          this.debtorDetails.DbDunsNo = event.dunsNumber; // Refresh the duns number
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error updating debtor details:', error);
          Swal.fire('Error', 'Failed to update debtor information.', 'error');
        }
      });
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
        this.debtorDetails = response.data[0];
        for (let it of response.data) {
          if (it.DebtorKey === this.ticketData.DebtorKey) {
            this.debtorDetails = it;
            break;
          }
        }
        this.cdr.detectChanges(); // Trigger change detection
        console.log('New Member Debtor details:', this.debtorDetails);
        
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

}
