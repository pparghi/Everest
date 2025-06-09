import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import {Observable} from 'rxjs';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { HttpClient } from '@angular/common/http';
import {startWith, map, switchMap} from 'rxjs/operators';
import { of } from 'rxjs';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { FilterService } from '../../services/filter.service';
import { InvoiceService } from '../../services/invoice.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

export interface DebtorInterface {
  Name: string;
  DebtorKey: string;
}

// interface for each invoice data
export interface InvoiceStatementInterface {
  Debtor: string;
  Client: string;
  PurchOrd: string;
  InvNo: string;
  Descr: string;
  InvDate: string;
  OpenDays: string;
  CurrencyType: string;
  Amt: string;
  Balance: string;
}

@Component({
  selector: 'app-documents-statements',
  templateUrl: './documents-statements.component.html',
  styleUrl: './documents-statements.component.css'
})
export class DocumentsStatementsComponent implements OnInit, AfterViewInit  {
  
  // #region constructor
  constructor(private http: HttpClient, private documentsReportsService: DocumentsReportsService, private riskService: RiskMonitoringService, private filterService: FilterService, private invoiceService: InvoiceService) {}

  // Define a FormGroup for filters
  filterForm = new FormGroup({
    Debtor: new FormControl(''),
    Office: new FormControl(''),
    CRM: new FormControl(''),
    InvoviceNumber: new FormControl(''),
    Reference: new FormControl(''),
    descriptionChecked: new FormControl(false),
  });

  // #region filter variables
  selectedDebtorKey: string = '';
  officeList: string[] = [];
  clientCRMList: any;
  
  debtorFilteredOptions: Observable<DebtorInterface[]> | undefined;
  
  isLoading = false;
  invoiceListSource = new MatTableDataSource<InvoiceStatementInterface>([]);
  
  pageSize: number = 25; // paginator page size
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // invoice list table columns
  invoceColumns: string[] = ['Debtor', 'Client', 'PurchOrd', 'InvNo', 'InvDate', 'OpenDays', 'CurrencyType', 'Amt', 'Balance'];

  
  // #region ngOnInit
  ngOnInit(): void {
    // load filter state from filter service
    const filterValues = this.filterService.getFilterState('documents-statements');
    // console.log('filterValues--', filterValues);
    if (filterValues) {
      // get filter values from filter state
      this.filterForm.patchValue({
        Debtor: filterValues.Debtor || '',
        Office: filterValues.Office || '',
        CRM: filterValues.CRM || '',
        InvoviceNumber: filterValues.InvoviceNumber || '',
        Reference: filterValues.Reference || '',
        descriptionChecked: filterValues.descriptionChecked || false
      });
    }

    this.loadOfficeList(); //load office list
    this.loadClientCRMList(); // load CRM list

    // update debtor selections when there is name changes
    this.debtorFilteredOptions = this.filterForm.get('Debtor')?.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        // console.log('Debtor value changed:', value);
        const searchTerm = typeof value === 'string' ? value : (value as unknown as DebtorInterface)?.Name || '';
        if (searchTerm) {
          return this.documentsReportsService.getDebtorsListByName(searchTerm);
        } else {
          return of([]); // Return empty array as Observable
        }
      }),
      map((response: any) => {
        // console.log('Searched debtor result:', response);
        return response?.data || [];
      })
    );

    // Subscribe to description checkbox changes
    this.filterForm.get('descriptionChecked')?.valueChanges.subscribe(() => {
      this.updateColumns();
      this.filterService.setFilterState('documents-statements', { "descriptionChecked": this.filterForm.get('descriptionChecked')?.value }); // save filter state
    });
  }

  ngAfterViewInit() {
    this.invoiceListSource.paginator = this.paginator;
  }


  // #region show rows with filters
  // event submiting the filters form
  onSubmitFilters(): void {
    console.log('Form submitted:', this.filterForm.value);
    this.getInvoiceListByFilters();
  }

  // API get invoice list based on filters
  getInvoiceListByFilters() {
    this.isLoading = true;
    
    const Debtor = this.filterForm.get('Debtor')?.value?.trim() || '%';
    const Office = this.filterForm.get('Office')?.value?.trim() || '%';
    const CRM = this.filterForm.get('CRM')?.value?.trim() || '%';
    const InvoviceNumber = this.filterForm.get('InvoviceNumber')?.value?.trim() || '%';
    const Reference = this.filterForm.get('Reference')?.value?.trim() || '%';

    // save all filters to cache
    this.filterService.setFilterState('documents-statements', { "Debtor": Debtor.replaceAll('%', '') });
    this.filterService.setFilterState('documents-statements', { "Office": Office.replaceAll('%', '') });
    this.filterService.setFilterState('documents-statements', { "CRM": CRM.replaceAll('%', '') });
    this.filterService.setFilterState('documents-statements', { "InvoviceNumber": InvoviceNumber.replaceAll('%', '') });
    this.filterService.setFilterState('documents-statements', { "Reference": Reference.replaceAll('%', '') });

    // Call the API to get the invoice list
    this.invoiceService.getInvoicesList('%', Debtor + '%', '2000-01-01', '2099-12-31', InvoviceNumber + '%', Reference + '%', '3%', Office + '%', 0, 9999, 0, 999999999, '2000-01-01', '2099-12-31', '2000-01-01', '2099-12-31', CRM + '%', '0', '%').subscribe((response: any) => {
      this.invoiceListSource.data = response.data;
      console.log('invoiceListSource--', response.data);
      this.isLoading = false;
    });
  }




  // #region export excel
  /** Export table to Excel */
  exportTableToExcel(): void {
    if (this.invoiceListSource.data.length === 0) {
      alert('No data available to export.');
      return;
    }

    // Prepare the data for export
    let exportData = [];
    if (this.filterForm.get('descriptionChecked')?.value) {
      exportData = this.invoiceListSource.data.map(item => {
        return {
          'Debtor': item.Debtor,
          'Client': item.Client,
          'PO#/Load#': item.PurchOrd,
          'Invoice Number': item.InvNo,
          'Description': item.Descr,
          'Invoice Date': item.InvDate,
          'Age': item.OpenDays,
          'Currency': item.CurrencyType,
          'Amount': item.Amt,
          'Balance': item.Balance
        };
      });
    }
    else {
      exportData = this.invoiceListSource.data.map(item => {
        return {
          'Debtor': item.Debtor,
          'Client': item.Client,
          'PO#/Load#': item.PurchOrd,
          'Invoice Number': item.InvNo,
          'Invoice Date': item.InvDate,
          'Age': item.OpenDays,
          'Currency': item.CurrencyType,
          'Amount': item.Amt,
          'Balance': item.Balance
        };
      });
    }

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Invoices_Statement': worksheet },
      SheetNames: ['Invoices_Statement']
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
    link.download = `invoices_statement_${dateTime}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }



  // #endregion export excel


  // #region filters
  // debtor name search filter
  // displayDebtorName(debtor: DebtorInterface): string {
  //   return debtor ? debtor.Name : '';
  // }
  displayDebtorName(debtor: string): string {
    return debtor ? debtor : '';
  }

  // load office list
  loadOfficeList() {
    this.riskService.getOfficeList().subscribe(response => {                                         
      this.officeList = response.officeList.map((office: any) => office.Office);
    });
  }

  // Call the API to get the list of clients
  loadClientCRMList() {
    this.riskService.getCRMList().subscribe(response => {
      this.clientCRMList = response.CRMList;
    });
  }

  // handle description label click
  onDescriptionLabelClick() {
    const currentValue = this.filterForm.get('descriptionChecked')?.value;
    this.filterForm.patchValue({ descriptionChecked: !currentValue });
    // update columns
    this.updateColumns();
  }
  
  private updateColumns() {
    const showDescription = this.filterForm.get('descriptionChecked')?.value;
    this.invoceColumns = showDescription ? 
      ['Debtor', 'Client', 'PurchOrd', 'InvNo', 'Descr', 'InvDate', 'OpenDays', 'CurrencyType', 'Amt', 'Balance'] : 
      ['Debtor', 'Client', 'PurchOrd', 'InvNo', 'InvDate', 'OpenDays', 'CurrencyType', 'Amt', 'Balance'];
  }


  // # endregion filters

}
