import { Component, OnInit } from '@angular/core';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import * as XLSX from 'xlsx-js-style';

interface MetricsData {
  category: string;
  subcategory?: string;
  isHeader?: boolean;
  isSummary?: boolean;
  isSubcategory?: boolean;
  march?: number;
  marchPct?: number;
  april?: number;
  aprilPct?: number;
  may?: number;
  mayPct?: number;
}

interface DebtorData {
  Debtor: string;
  MasterDebtor: string;
  TotalCreditLimit: string;
  IndivCreditLimit: string;
  Balance: string;
  CreditUse: string;
  CalcRateCode: string;
  AvgDaysAll: string;
  AvgDays90: string;
  AvgDays60: string;
  LastPmtDate: string | null;
  Warning: string;
  NoBuyDispute: string;
  MotorCarrNo: string | null;
  DbDunsNo: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  displayedColumns: string[] = ['category', 'march', 'marchPct', 'april', 'aprilPct', 'may', 'mayPct'];
  
  // Loading state for file downloads
  isLoadingDebtorList = false;
  
  metricsData: MetricsData[] = [
    { category: 'FACTORSOFT CREDIT REQUEST TOTAL', isHeader: true, march: 1931, marchPct: 100, april: 1954, aprilPct: 100, may: 2221, mayPct: 100 },
    { category: 'Average Credit Request Per Day:', isSummary: true, march: 97, marchPct: 100, april: 89, aprilPct: 100, may: 101, mayPct: 100 },
    
    { category: 'Breakdown by Industry:', isHeader: true },
    { category: 'Breakdown by Industry:', subcategory: 'Commercial', isSubcategory: true, march: 527, marchPct: 27, april: 678, aprilPct: 35, may: 666, mayPct: 30 },
    { category: 'Breakdown by Industry:', subcategory: 'Transportation', isSubcategory: true, march: 1404, marchPct: 73, april: 1276, aprilPct: 65, may: 1555, mayPct: 70 },
    
    { category: 'Breakdown by Region:', isHeader: true },
    { category: 'Breakdown by Region:', subcategory: 'Canadian', isSubcategory: true, march: 1492, marchPct: 77, april: 1387, aprilPct: 71, may: 1665, mayPct: 75 },
    { category: 'Breakdown by Region:', subcategory: 'US', isSubcategory: true, march: 439, marchPct: 23, april: 567, aprilPct: 29, may: 556, mayPct: 25 },
    
    { category: 'Breakdown by Decision:', isHeader: true },
    { category: 'Breakdown by Decision:', subcategory: 'Approved', isSubcategory: true, march: 1508, marchPct: 78, april: 1442, aprilPct: 74, may: 1705, mayPct: 77 },
    { category: 'Breakdown by Decision:', subcategory: 'SOA', isSubcategory: true, march: 277, marchPct: 14, april: 186, aprilPct: 10, may: 308, mayPct: 14 },
    { category: 'Breakdown by Decision:', subcategory: 'Declined', isSubcategory: true, march: 142, marchPct: 7, april: 326, aprilPct: 17, may: 183, mayPct: 8 },
    { category: 'Breakdown by Decision:', subcategory: 'Deleted', isSubcategory: true, march: 4, marchPct: 0, april: 0, aprilPct: 0, may: 25, mayPct: 1 }
  ];

  constructor(private documentsReportsService: DocumentsReportsService) {}

  ngOnInit(): void {
    // Any initialization logic
  }

  // Helper function to determine the class for special values
  getCellClass(row: MetricsData, column: string): string {
    if (row.subcategory === 'Canadian' && column.startsWith('may')) {
      return 'highlight-value';
    }
    if (row.subcategory === 'US' && column.startsWith('may')) {
      return 'highlight-value-blue';
    }
    return '';
  }

  // Method to handle report download
  downloadReport(reportType: string): void {
    // Prevent multiple downloads
    if (this.isLoadingDebtorList) {
      return;
    }
    
    console.log(`Downloading report: ${reportType}`);
    
    switch (reportType) {
      case 'debtor-list':
        this.downloadDebtorListReport();
        break;
      default:
        console.log('Unknown report type');
    }
  }

  private downloadDebtorListReport(): void {
    // Start loading
    this.isLoadingDebtorList = true;
    
    this.documentsReportsService.getFullDebtorListForReport().subscribe({
      next: (response: any) => {
        console.log('Report data received:', response);
        const debtorData: DebtorData[] = response.data;
        
        if (!debtorData || debtorData.length === 0) {
          alert('No data available for export.');
          this.isLoadingDebtorList = false;
          return;
        }
        
        this.exportDebtorListToExcel(debtorData);
        // Loading will be stopped in the export method
      },
      error: (error: any) => {
        console.error('Error fetching debtor list:', error);
        alert('Error fetching data. Please try again.');
        this.isLoadingDebtorList = false;
      }
    });
  }

  private exportDebtorListToExcel(debtorData: DebtorData[]): void {
    // Create a simple CSV-like structure first, then convert to Excel
    const headers = [
      'Debtor', 'Master Debtor', 'Total Credit Limit', 'Individual Credit Limit', 
      'Balance', 'Credit Use', 'Rate Code', 'Avg Days (All)', 
      'Avg Days (90)', 'Avg Days (60)', 'Last Payment Date', 'Warning', 
      'No Buy Dispute', 'Motor Carrier No', 'DUNS Number'
    ];

    // Prepare raw data array (no complex objects)
    const rawData: any[][] = [headers];
    
    debtorData.forEach(item => {
      rawData.push([
        item.Debtor?.trim() || '',
        item.MasterDebtor?.trim() || '',
        item.TotalCreditLimit?.trim() || '',
        item.IndivCreditLimit?.trim() || '',
        item.Balance?.trim() || '',
        item.CreditUse?.trim() || '',
        item.CalcRateCode?.trim() || '',
        item.AvgDaysAll?.trim() || '',
        item.AvgDays90?.trim() || '',
        item.AvgDays60?.trim() || '',
        // this.formatDate(item.LastPmtDate),
        item.LastPmtDate || '',
        item.Warning?.trim() || '',
        item.NoBuyDispute?.trim() || '',
        item.MotorCarrNo?.trim() || '',
        item.DbDunsNo?.trim() || ''
      ]);
    });

    // Create worksheet from array (much more efficient)
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rawData);

    // Set column widths only (no cell styling)
    worksheet['!cols'] = [
      { wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 }
    ];

    // Apply number formatting to specific columns (without heavy cell styling)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let R = 1; R <= range.e.r; R++) { // Start from row 1 (skip header)
      // Currency format for columns C, D, E (Total Credit Limit, Individual Credit Limit, Balance)
      for (let C = 2; C <= 4; C++) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[address]) {
          worksheet[address].z = '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)';
          // Convert string to number for proper Excel formatting
          const numValue = parseFloat(worksheet[address].v) || 0;
          worksheet[address].v = numValue;
          worksheet[address].t = 'n';
        }
      }
      
      // Percentage format for column F (Credit Use)
      const creditUseAddress = XLSX.utils.encode_cell({ r: R, c: 5 });
      if (worksheet[creditUseAddress]) {
        worksheet[creditUseAddress].z = '0%';
        // Convert to decimal for percentage (e.g., 25 becomes 0.25)
        const percentValue = (parseFloat(worksheet[creditUseAddress].v) || 0);
        worksheet[creditUseAddress].v = percentValue;
        worksheet[creditUseAddress].t = 'n';
      }
      
      // Float number format for columns H, I, J (Avg Days All, 90, 60)
      for (let C = 7; C <= 9; C++) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[address]) {
          worksheet[address].z = '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)';
          // Convert string to number
          const numValue = parseFloat(worksheet[address].v) || 0;
          worksheet[address].v = numValue;
          worksheet[address].t = 'n';
        }
      }
      
      // Date format for column K (Last Payment Date)
      const dateAddress = XLSX.utils.encode_cell({ r: R, c: 10 });
      if (worksheet[dateAddress] && worksheet[dateAddress].v && worksheet[dateAddress].v !== '') {
        try {
          worksheet[dateAddress].v = worksheet[dateAddress].v;
          worksheet[dateAddress].t = 'd';
          worksheet[dateAddress].z = 'yyyy-mm-dd';
        } catch (e) {
          console.warn('Invalid date format:', worksheet[dateAddress].v);
        }
      }

    }

    // Add autofilter
    worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' };

    // Apply styles to the header row
    for (let C = 0; C <= range.e.c; C++) {
      const headerAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[headerAddress]) {
        worksheet[headerAddress].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
            sz: 11,
            name: "Calibri"
          },
          fill: {
            patternType: "solid",
            fgColor: { rgb: "4472C4" }
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        };
      }
    }

    // Apply styles to data rows with alternating colors
    for (let R = 1; R <= range.e.r; R++) {
      const isEvenRow = R % 2 === 0;
      const fillColor = isEvenRow ? "F2F2F2" : "FFFFFF";
      
      for (let C = 0; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[cellAddress]) {
          // Determine alignment based on column type
          let horizontalAlign = "left";
          if (C >= 2 && C <= 4) horizontalAlign = "right"; // Currency columns
          if (C === 5) horizontalAlign = "center"; // Percentage column
          if (C >= 7 && C <= 9) horizontalAlign = "right"; // Number columns
          
          worksheet[cellAddress].s = {
            font: {
              sz: 10,
              name: "Calibri"
            },
            fill: {
              patternType: "solid",
              fgColor: { rgb: fillColor }
            },
            border: {
              top: { style: "thin", color: { rgb: "D0D0D0" } },
              bottom: { style: "thin", color: { rgb: "D0D0D0" } },
              left: { style: "thin", color: { rgb: "D0D0D0" } },
              right: { style: "thin", color: { rgb: "D0D0D0" } }
            },
            alignment: {
              horizontal: horizontalAlign,
              vertical: "center"
            }
          };
        }
      }
    }

    // Create workbook with minimal metadata
    const workbook: XLSX.WorkBook = {
      Sheets: { 'DebtorList': worksheet },
      SheetNames: ['DebtorList']
    };

    // Generate Excel file with styling enabled
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
      compression: true
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const fileName = `Debtor_List_Credit_Dept_${currentDate}.xlsx`;

    this.saveExcelFile(excelBuffer, fileName);
    
    // Stop loading
    this.isLoadingDebtorList = false;
  }

  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }


}