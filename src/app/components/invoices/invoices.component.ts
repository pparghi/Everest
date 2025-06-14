import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { InvoiceService } from '../../services/invoice.service';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { FilterService } from '../../services/filter.service';
import * as XLSX from 'xlsx';

// interface for each invoice data
export interface InvoiceInterface {
  InvoiceKey: string;
  InvDate: string;
  CloseDate: string;
  InvNo: string;
  PurchOrd: string;
  Amt: string;
  Balance: string;
  BuyTransKey: string;
  Debtor: string;
  Client: string;
  BatchNo: string;
  PurchaseDate: string;
  Advance: string;
  OpenDays: string;
  PaymentTransKey: string;
  Status: string;
  DisputeCode: string;
  DebtorKey: string;
  DebtorEmail: string;
  DebtorPhone: string;
  AcctExec: string;
  ClientKey: string;
  Addr1: string;
  Addr2: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  Warning: string;
  NoBuyCode: string;
  InputTransKey: string;
}

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})

export class InvoicesComponent implements OnInit, AfterViewInit  {
  
  clientCRMList: any;
  invoiceStatusList: any;
  disputeCodeList: any;
  // invoiceListSource: InvoiceInterface[] = [];
  invoiceListSource = new MatTableDataSource<InvoiceInterface>([]);
  pageSize: number = 25; // paginator page size
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isLoading = true;


  // Define a FormGroup for filters
  // get today's date and save in yyyy-mm-dd format
  todayDate: string[] = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
  todayDateStr: string = this.todayDate[2] + '-' + this.todayDate[0] + '-' + this.todayDate[1];
  filterForm = new FormGroup({
    InvFrom: new FormControl(this.todayDateStr),
    InvTo: new FormControl(this.todayDateStr),
    InvoviceNumber: new FormControl(''),
    POLoadNumber: new FormControl(''),
    Client: new FormControl(''),
    Debtor: new FormControl(''),
    Status: new FormControl(''),
    CRM: new FormControl(''),
    DisputeCode: new FormControl([]),
    BatchNumber: new FormControl(''),
  });
  
  // Add selection model
  selection = new SelectionModel<InvoiceInterface>(true, []);

  // invoice list table columns
  invoceColumns: string[] = ['select', 'InvDate', 'OpenDays', 'InvNo', 'PurchOrd', 'Client', 'Debtor', 'Status', 'AcctExec', 'DisputeCode', 'BatchNo', 'Amt', 'Balance'];

  constructor(private riskMonitoringService: RiskMonitoringService, private invoiceService: InvoiceService, private documentsReportsService: DocumentsReportsService, private filterService: FilterService) { };

  ngOnInit(): void {
    // load filter state from filter service
    const filterValues = this.filterService.getFilterState('invoices');
    // console.log('filterValues--', filterValues);
    if (filterValues) {
      // get filter values from filter state
      this.filterForm.patchValue({
        InvFrom: filterValues.InvFrom || this.todayDateStr,
        InvTo: filterValues.InvTo || this.todayDateStr,
        InvoviceNumber: filterValues.InvoviceNumber || '',
        POLoadNumber: filterValues.POLoadNumber || '',
        Client: filterValues.Client || '',
        Debtor: filterValues.Debtor || '',
        Status: filterValues.Status || '',
        CRM: filterValues.CRM || '',
        DisputeCode: filterValues.DisputeCode ? filterValues.DisputeCode.split(',') : [],
        BatchNumber: filterValues.BatchNumber || ''
      });
    }

    this.loadClientCRMList();
    this.loadInvoiceStatusList();
    this.getDisputeCodeList();
    this.getInvoiceListByFilters();
  }

  ngAfterViewInit() {
    this.invoiceListSource.paginator = this.paginator;
    // clear selection when page changes
    this.paginator.page.subscribe(() => {
      this.selection.clear();
    });
  }

  // Call the API to get the list of clients
  loadClientCRMList() {
    this.riskMonitoringService.getCRMList().subscribe(response => {
      this.clientCRMList = response.CRMList;
    });
  }

  // Call the API to get the list of invoice status
  loadInvoiceStatusList() {
    this.invoiceService.getInvoiceStatusList().subscribe((response: any) => {
      this.invoiceStatusList = response.data;
      // console.log(response);
    });
  }

  // Call the API to get the Dispute Code List
  getDisputeCodeList() {
    this.invoiceService.getDisputeCodeList().subscribe((response: any) => {
      this.disputeCodeList = response.data;
      // console.log(response);
    });
  }

  // event submiting the filters form
  onSubmitFilters(): void {
    console.log('Form submitted:', this.filterForm.value);
    this.selection.clear(); // clear selection when filters are applied
    this.getInvoiceListByFilters();
  }

  // dispaly selected dispute code list
  displaySelectedDisputeCode(): string {
    const selected: string[] = this.filterForm.get('DisputeCode')?.value || [];
    // return if no selected dispute code
    if (selected.length === 0) {
      return '';
    }

    let resultArray = [];
    let selectedArray = [];
    for (let row of this.disputeCodeList) {
      if (selected?.includes(row.DisputeCodeKey)) {
        resultArray.push(row.DisputeCode);
        selectedArray.push(row.DisputeCodeKey);
      }
      if (selectedArray.length === selected.length) {
        break;
      }
    }
    
    return resultArray.join(', ');
  }

  // API get invoice list based on filters
  getInvoiceListByFilters() {
    this.isLoading = true;
    const InvFrom = this.filterForm.get('InvFrom')?.value?.trim() || this.todayDateStr;
    const InvTo = this.filterForm.get('InvTo')?.value?.trim() || this.todayDateStr;
    const InvoviceNumber = this.filterForm.get('InvoviceNumber')?.value?.trim() || '%';
    const POLoadNumber = this.filterForm.get('POLoadNumber')?.value?.trim() || '%';
    const Client = this.filterForm.get('Client')?.value?.trim() || '%';
    const Debtor = this.filterForm.get('Debtor')?.value?.trim() || '%';
    const Status = this.filterForm.get('Status')?.value?.trim() || '%';
    const CRM = this.filterForm.get('CRM')?.value?.trim() || '%';
    const DisputeCode = this.filterForm.get('DisputeCode')?.value?.join(',')?.trim() || '0';
    const BatchNumber = this.filterForm.get('BatchNumber')?.value?.trim() || '%';
    
    // save all filters to cache
    this.filterService.setFilterState('invoices', { "InvFrom": InvFrom });
    this.filterService.setFilterState('invoices', { "InvTo": InvTo });
    this.filterService.setFilterState('invoices', { "InvoviceNumber": InvoviceNumber.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "POLoadNumber": POLoadNumber.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "Client": Client.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "Debtor": Debtor.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "Status": Status.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "CRM": CRM.replaceAll('%', '') });
    this.filterService.setFilterState('invoices', { "DisputeCode": DisputeCode==='0'? '' : DisputeCode });
    this.filterService.setFilterState('invoices', { "BatchNumber": BatchNumber.replaceAll('%', '') });

    // Call the API to get the invoice list
    this.invoiceService.getInvoicesList(Client+'%', Debtor+'%', InvFrom, InvTo, InvoviceNumber+'%', POLoadNumber+'%', Status+'%', '%', 0, 9999, 0, 999999999, '2000-01-01', '2099-12-31', '2000-01-01', '2099-12-31', CRM+'%', DisputeCode, BatchNumber+'%').subscribe((response: any) => {
      this.invoiceListSource.data = response.data;
      // console.log('invoiceListSource--', this.invoiceListSource);
      this.isLoading = false;
    });
  }

  // method to conert string to number
  convertStringToNumber(value: string): number {
    const numberValue = parseFloat(value.replace(/,/g, ''));
    return isNaN(numberValue) ? 0 : numberValue;
  }


  // #region selection methods
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    // condition of last page
    if (this.invoiceListSource.data.length > this.paginator.pageSize && this.paginator.pageIndex === this.paginator.getNumberOfPages() - 1) {
      const numSelected = this.selection.selected.length;
      const numRows = this.invoiceListSource.data.length - (this.paginator.pageIndex * this.paginator.pageSize);
      return numSelected === numRows;
    }
    else {
      const numSelected = this.selection.selected.length;
      const numRows = this.invoiceListSource.data.length < (this.invoiceListSource.paginator?.pageSize ? this.invoiceListSource.paginator?.pageSize:1000) ? this.invoiceListSource.data.length : this.invoiceListSource.paginator?.pageSize;
      return numSelected === numRows;
    }
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    // get subset of first page of data
    // console.log('paginator--', this.paginator);
    const firstPageData = this.invoiceListSource.data.slice(this.paginator.pageIndex * this.paginator.pageSize, (this.paginator.pageIndex + 1) * this.paginator.pageSize);
    this.selection.select(...firstPageData);
  }

  // #region export excel
  /** Export selected rows to Excel */
  exportSelectedToExcel(): void {
    if (this.selection.selected.length === 0) {
      alert('Please select at least one row to export');
      return;
    }

    // Prepare the data for export
    const exportData = this.selection.selected.map(item => {
      return {
        'Invoice Date': item.InvDate,
        'Open Days': item.OpenDays,
        'Invoice Number': item.InvNo,
        'PO Number': item.PurchOrd,
        'Client': item.Client,
        'Debtor': item.Debtor,
        'Status': item.Status,
        'Account Executive': item.AcctExec,
        'Dispute Code': item.DisputeCode,
        'Batch Number': item.BatchNo,
        'Amount': item.Amt,
        'Balance': item.Balance
      };
    });

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const workbook: XLSX.WorkBook = { 
      Sheets: { 'Invoices': worksheet }, 
      SheetNames: ['Invoices'] 
    };

    // Generate Excel file
    const excelBuffer: any = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });

    this.saveExcelFile(excelBuffer);
  }
  /** Save the Excel file */
  private saveExcelFile(buffer: any): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url: string = window.URL.createObjectURL(data);
    const link: HTMLAnchorElement = document.createElement('a');
    
    // Format current date-time as YYYYMMDDHHMMSS
    const now = new Date();
    const dateTime = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    
    link.href = url;
    link.download = `invoices_${dateTime}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // #region show invoice PDF
  clickInvoiceNumber(element: any) {// Open a blank tab immediately
    console.log('element--', element);
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
      else if (response?.status == 'success') {
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

}