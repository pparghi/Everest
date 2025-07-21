import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { DecimalPipe } from '@angular/common';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from 'chart.js';

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

@Component({
  selector: 'app-ticketing-analysis-dialog',
  templateUrl: './ticketing-analysis-dialog.component.html',
  styleUrl: './ticketing-analysis-dialog.component.css',
  providers: [DecimalPipe]
})
export class TicketingAnalysisDialogComponent implements OnInit {

  // variables for analysis dialog
  ticketData: any;
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
  readonly panel1OpenState = signal(false);
  readonly pane21OpenState = signal(false);
  
  showDetailedView: string = 'default'; // default view for top right panel

  // charts
  chart: any;
  @ViewChild('trendBarChart') chartCanvas!: ElementRef;
  chart2: any;
  @ViewChild('trendBarChart2') chartCanvas2!: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<TicketingAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private memberDebtorsService: MemberDebtorsService,
    private dataService: DebtorsApiService,
    private _decimalPipe: DecimalPipe
  ) {}

  ngOnInit() {
    // Load analysis data
    console.log('Analysis Dialog data:', this.data);
    this.ticketData = this.data;

    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), this.ticketData.ClientNo, this.trendPeriodChar, 1); // load for chart 1
    this.loadTrendDialogData(parseInt(this.ticketData.DebtorKey), '', this.trendPeriodChar2, 2); // load for chart 2
  
    // fetch debtor details
    if (this.ticketData.DebtorKey) {
      this.memberDebtorsService.getMemberDebtors(parseInt(this.ticketData.DebtorKey)).subscribe(response => {
        this.debtorDetails = response.data[0];
        console.log('Member Debtors Response:', this.debtorDetails);
      }, error => {
        console.error('Error fetching member debtors:', error);
      });
    }
  }

  // convert string number to currency format
  formatCurrency(value: any): string {
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

      // for loading the chart 1
      if (chartNumber === 1){
        if (this.chartCanvas && this.chartCanvas.nativeElement) {
          const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
          this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
        }
        // deleyed loading of the chart
        else {
          setTimeout(() => {
            // console.log('Reloading the chart');
            const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
            this.createTrendBarChart(this.ticketingTrendDataSource.data, tempPeriod, this.trendColumn);
          }, 500);
        }
      }
      else {
        if (this.chartCanvas2 && this.chartCanvas2.nativeElement) {
          const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
          this.createTrendBarChart(this.ticketingTrendDataSource2.data, tempPeriod, this.trendColumn2, 2);
        }
        // deleyed loading of the chart
        else {
          setTimeout(() => {
            // console.log('Reloading the chart');
            const tempPeriod = trendPeriodChar === 'M' ? 'Months' : trendPeriodChar === 'Q' ? 'Quarters' : 'Years';
            this.createTrendBarChart(this.ticketingTrendDataSource2.data, tempPeriod, this.trendColumn2, 2);
          }, 500);
        }
      }

    });
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
    // console.log("data--", data);
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
    let tempLabels: string[] = [];
    let tempData: number[] = [];
    for (let it of data) {
      tempLabels.push(it.YearMonth);
      tempData.push(parseFloat(it[column]));
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

  onClose(): void {
    this.dialogRef.close();
  }

  // method to show detailed view
  onMoreDetailsClick(name: string): void {
    if (name){
      this.showDetailedView = name;
    }
  }

}
