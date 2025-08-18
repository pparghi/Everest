import { Component, OnInit, ViewChild } from '@angular/core';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-client-documents',
  templateUrl: './client-documents.component.html',
  styleUrl: './client-documents.component.css'
})
export class ClientDocumentsComponent implements OnInit {

  constructor( 
    private http: HttpClient, 
    private documentsReportsService: DocumentsReportsService,
    private filterService: FilterService
  ) {}

  // Define a FormGroup for filters
  filterForm = new FormGroup({
    Client: new FormControl(''),
    category: new FormControl(''),
    fileNameContains: new FormControl(''),
    // rowsNumber: new FormControl(''),
  });
  

  categoryList: any[] = [];
  clientDocumentListSource = new MatTableDataSource<any>([]);
  clientDocumentColumns: string[] = ['FileName', 'Descr', 'DropDate'];
  isLoading = false;
  pageSize: number = 25; // paginator page size
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  ngOnInit(): void {
    this.getClientDocumentCategory();
  }

  ngAfterViewInit() {
    this.clientDocumentListSource.paginator = this.paginator;
  }


  // load Client Document Category
  getClientDocumentCategory() { 
    this.documentsReportsService.getClientDocumentCategory().subscribe((response: any) => {  
      console.log('Client Document Category:', response);                                       
      this.categoryList = response.data;
    });
  }

  onSubmitFilters() {
    this.getClientDocumentListByFilters();
  }

  // fetch client document list
  getClientDocumentListByFilters() {
    this.isLoading = true;
    
    const Client = this.filterForm.get('Client')?.value ? '%'+this.filterForm.get('Client')?.value?.trim()+'%' : '%';
    const category = this.filterForm.get('category')?.value?.trim() || '';
    const fileNameContains = this.filterForm.get('fileNameContains')?.value?.trim() || '';

    // save all filters to cache
    // this.filterService.setFilterState('documents-statements', { "Debtor": Debtor.replaceAll('%', '') });

    // Call the API to get the invoice list
    this.documentsReportsService.getClientDocumentList(Client, category, fileNameContains).subscribe((response: any) => {
      this.clientDocumentListSource.data = response.data;
      console.log('clientDocumentListSource--', response.data);
      this.isLoading = false;
    });
  }


}
