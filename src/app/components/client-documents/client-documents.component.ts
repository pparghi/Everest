import { Component, OnInit, ViewChild } from '@angular/core';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FilterService } from '../../services/filter.service';
import { MatDialog } from '@angular/material/dialog';
import { FileUploadDialogComponent } from '../file-upload-dialog/file-upload-dialog.component';
import { CacheService } from '../../services/cache.service';

@Component({
  selector: 'app-client-documents',
  templateUrl: './client-documents.component.html',
  styleUrl: './client-documents.component.css'
})
export class ClientDocumentsComponent implements OnInit {

  constructor( 
    private http: HttpClient, 
    private documentsReportsService: DocumentsReportsService,
    private filterService: FilterService,
    private dialog: MatDialog,
    private cacheService: CacheService
  ) {}

  // Define a FormGroup for filters
  filterForm = new FormGroup({
    Client: new FormControl(''),
    category: new FormControl('35'),
    fileNameContains: new FormControl(''),
    // rowsNumber: new FormControl(''),
  });
  
  categoryList: any[] = [];
  clientDocumentListSource = new MatTableDataSource<any>([]);
  clientDocumentColumns: string[] = ['View', 'ClientNo', 'Client', 'FileName', 'FileType', 'Descr', 'DropDate'];
  isLoading = false;
  pageSize: number = 25; // paginator page size
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  clientFullList: any[] = [];
  filteredClientOptions: any[] = [];
  clientRequiredError: boolean = false; // Flag for client input validation error

  ngOnInit(): void {
    this.getClientDocumentCategory();
    this.getClientFullList();
    // Set up autocomplete filtering
    this.filterForm.get('Client')?.valueChanges.subscribe(value => {
      this.filterClientOptions(value);
      // Clear error state when user types
      if (value) {
        this.clientRequiredError = false;
      }
    });
  }

  ngAfterViewInit() {
    this.clientDocumentListSource.paginator = this.paginator;
  }


  // load Client Document Category
  getClientDocumentCategory() { 
    this.documentsReportsService.getClientDocumentCategory().subscribe((response: any) => {  
      // console.log('Client Document Category:', response);                                       
      this.categoryList = response.data;
    });
  }  
  
  onSubmitFilters() {
    // Get client value from form
    const clientValue = this.filterForm.get('Client')?.value;
    
    // Validate client is not empty
    if (!clientValue) {
      // Set error flag for displaying the error message
      this.clientRequiredError = true;
      return; // Exit the function early
    }
    
    // Reset error flag if validation passes
    this.clientRequiredError = false;
    
    // If client value is valid, proceed with search
    this.getClientDocumentListByFilters();
  }

  // fetch client document list
  getClientDocumentListByFilters() {
    this.isLoading = true;
    
    const Client = this.filterForm.get('Client')?.value ? ''+this.filterForm.get('Client')?.value?.trim() : '%';
    const category = this.filterForm.get('category')?.value?.trim() || '';
    const fileNameContains = this.filterForm.get('fileNameContains')?.value?.trim() || '';

    // save all filters to cache
    // this.filterService.setFilterState('documents-statements', { "Debtor": Debtor.replaceAll('%', '') });

    // Call the API to get the invoice list
    console.log('Client:', Client, 'Category:', category, 'FileNameContains:', fileNameContains);
    this.documentsReportsService.getClientDocumentList(Client, category, fileNameContains).subscribe((response: any) => {
      // split file name to name and type
      let temp = response.data.map((item: any) => ({...item}));
      temp.forEach((element: any) => {
        if (element.FileName) {
          const fileParts = element.FileName.split('.');
          element.FileType = fileParts.length > 1 ? fileParts.pop().toUpperCase() : '';
          element.FileName = fileParts.join('.'); // Join the remaining parts as the name
        } else {
          element.FileType = '';
        }
      });
      this.clientDocumentListSource.data = temp;
      // console.log('clientDocumentListSource--', temp);
      this.isLoading = false;
    });
  }

  // method for viewing file
  viewFile(element: any) {
    const fileName = element.FileName;
    const fileNameBase64 = btoa(fileName);
    const fileType = element.FileType.toLowerCase();
    const docHdrKey = element.DocHdrKey;
    const path = element.Path;
    const fullPath = path + "\\" + docHdrKey + "." + fileType;
    const fullPathBase64 = btoa(fullPath); // Convert to base64 if needed

    console.log('Viewing file:', fileName, ' | Full Path:', fullPath, ' | File Type:', fileType);
    
    const apiUrl = `https://everest.revinc.com:4202/api/showFile?title=${fileNameBase64}&encodeFilePath=${fullPathBase64}&fileType=${fileType}`;
    window.open(apiUrl, '_blank');
  }

  // get client full list
  getClientFullList() {
    this.documentsReportsService.getClientFullList().subscribe((response: any) => {
      // console.log('Client Full List:', response);
      
      // Check if response has the expected data structure
      if (response && 
          Array.isArray(response.masterClients) && 
          Array.isArray(response.memberClients)) {
        
        // Combine both arrays into one
        // this.clientFullList = [
        //   ...response.masterClients,
        //   ...response.memberClients
        // ];
        
        // Sort the combined array by ClientName
        // this.clientFullList.sort((a, b) => {
        //   // Handle null or undefined values
        //   const nameA = a.ClientName ? a.ClientName.toUpperCase() : '';
        //   const nameB = b.ClientName ? b.ClientName.toUpperCase() : '';
          
        //   // Compare the names for sorting
        //   if (nameA < nameB) {
        //     return -1;
        //   }
        //   if (nameA > nameB) {
        //     return 1;
        //   }
        //   return 0;
        // });

        // use master client list only for now
        this.clientFullList = response.masterClients;
        
        this.filteredClientOptions = this.clientFullList; // Initialize filtered options
      } 
    }, error => {
      console.error('Error fetching client list:', error);
    });
  }

  // Filter client options based on input
  filterClientOptions(value: string | null) {
    if (!value) {
      this.filteredClientOptions = this.clientFullList.slice(0, 10); // Show first 10 as default
      return;
    }
    
    const filterValue = value.toLowerCase();
    this.filteredClientOptions = this.clientFullList.filter(client => 
      client.ClientName.toLowerCase().includes(filterValue)
    );
  }
    displayClientName(client: any): string {
    if (typeof client === 'string') {
      return client;
    }
    else {
      return client ? client.ClientName : '';
    }
  }
  
  // Method to open the file upload dialog
  openUploadDialog(): void {
    // Get the selected client
    const clientValue = this.filterForm.get('Client')?.value;
    let clientName = clientValue?clientValue.trim() : '';

    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '800px',
      maxWidth: 'none',
      height: 'auto',
      data: {
        clientName: clientName,
        categories: this.categoryList
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('Dialog closed with success uploading files');
        // Refresh the document list if upload was successful
        this.cacheService.removeByPattern('/api/getClientDocumentList?');
        this.getClientDocumentListByFilters();
      }
    });
  }

}
