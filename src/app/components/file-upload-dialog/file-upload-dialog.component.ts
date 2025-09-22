import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { DocumentsReportsService } from '../../services/documents-reports.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

export interface DialogData {
  clientName: string;
  categories: any[];
}

export interface clientListElement {
  ClientId: string;
  ClientKey: string;
  ClientName: string;
}

export interface FileUploadItem {
  file: File;
  name: string;
  type: string;
  size: string;
  category: string;
  description: string;
  progress: number;
  isUploading: boolean;
  error?: string;
  previewUrl?: string;
}

@Component({
  selector: 'app-file-upload-dialog',
  templateUrl: './file-upload-dialog.component.html',
  styleUrl: './file-upload-dialog.component.css'
})
export class FileUploadDialogComponent implements OnInit {

  // region Variables
  uploadForm: FormGroup;
  searchForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  isDragging = false;
  
  // New properties for multiple file upload
  uploadedFiles: FileUploadItem[] = [];
  acceptedFileTypeArray: string[] = [
      "JPG", "JPEG", "PNG", "GIF", "TIFF", "BMP", "RAW", "SVG", 
      "TXT", "DOC", "DOCX", "PDF", "PAGES", "XLS", "XLSX", "PPT", "PPTX", "RTF", "CSV", "XML", "ODT",
      "EML", "MSG", "MBOX"
    ];
  acceptedFileTypes = this.acceptedFileTypeArray.map(ext => '.' + ext.toLowerCase()).join(',');
  
  memberClientList: clientListElement[] = [];
  masterClientList: clientListElement[] = [];
  filteredClients: clientListElement[] = [];
  selectedClient: clientListElement | null = null;  

  userID: string = '';
  
  // Stepper properties
  currentStep = 0;
  
  constructor(
    public dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private http: HttpClient,
    private documentsReportsService: DocumentsReportsService
  ) {
    // Initialize the search form
    this.searchForm = this.fb.group({
      clientType: ['master'], // Default to master
      clientSearch: ['']
    });
    
    // Initialize the upload form - keeping it for structure, but not using for form controls
    this.uploadForm = this.fb.group({});
  }
  //region OnInit
  ngOnInit(): void {
    this.getMemberMasterClientList();
    
    // if client name is not empty, search client list
    if (this.data.clientName) {
      this.searchClients(this.data.clientName);
    }

    // Listen for changes to client search input
    this.searchForm.get('clientSearch')?.valueChanges.subscribe(value => {
      this.searchClients(value);
    });
    
    // Listen for changes to client type radio buttons
    this.searchForm.get('clientType')?.valueChanges.subscribe(() => {
      // Re-run search when client type changes
      const searchValue = this.searchForm.get('clientSearch')?.value;
      if (searchValue) {
        this.searchClients(searchValue);
      }
    });

    // get userID
    this.http.get<{ mail?: string }>(GRAPH_ENDPOINT).subscribe(profile => {
      if (profile.mail) {
        this.userID = profile.mail.match(/^([^@]*)@/)?.[1] || '';
      } else {
        this.userID = 'Unkown';
      }
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }  /**
   * Process files for upload
   */
  processFiles(files: FileList): void {
    // Convert FileList to array
    Array.from(files).forEach(file => {
      // Check if file type is supported
      if (!this.isFileTypeSupported(file)) {
        alert(`File type not supported: ${file.name}. Supported file types: Word, PDF, images.`);
        return;
      }
      
      // Get the first category by default (if available)
      const defaultCategory = this.data.categories && this.data.categories.length > 0 
        ? this.data.categories[0].DocCatKey 
        : '';
      
      // Create file upload item
      const fileItem: FileUploadItem = {
        file: file,
        name: file.name,
        type: file.type,
        size: this.formatFileSize(file.size),
        category: defaultCategory,
        description: '',
        progress: 0,
        isUploading: false
      };
      
      // Add file preview URL for images
      if (file.type.startsWith('image/')) {
        fileItem.previewUrl = URL.createObjectURL(file);
      }
      
      this.uploadedFiles.push(fileItem);
    });
    
    // Automatically go to next step (Files List) if files were added
    if (this.uploadedFiles.length > 0) {
      this.nextStep();
    }
  }
  
  /**
   * Format file size to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Check if file type is supported
   */
  isFileTypeSupported(file: File): boolean {
    const supportedTypes = [
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    return supportedTypes.includes(file.type) || this.acceptedFileTypeArray.includes(file.name.split('.').pop()?.toUpperCase() || '');
  }
  
  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  
  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  
  /**
   * Handle drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }
    /**
   * Remove a file from the upload list
   */
  removeFile(index: number): void {
    // If file has a preview URL, revoke it to free memory
    if (this.uploadedFiles[index].previewUrl) {
      URL.revokeObjectURL(this.uploadedFiles[index].previewUrl!);
    }
    
    this.uploadedFiles.splice(index, 1);
  }
    /**
   * Get category description for display
   */
  getCategoryDescription(categoryKey: string): string {
    if (!categoryKey) return '';
    
    const category = this.data.categories.find(c => c.DocCatKey === categoryKey);
    return category ? category.Descr : categoryKey;
  }
  
  /**
   * Update file category
   */
  updateFileCategory(index: number, categoryKey: string): void {
    if (index >= 0 && index < this.uploadedFiles.length) {
      this.uploadedFiles[index].category = categoryKey;
    }
  }
  
  /**
   * Update file description
   */
  updateFileDescription(index: number, description: string): void {
    if (index >= 0 && index < this.uploadedFiles.length) {
      this.uploadedFiles[index].description = description;
    }
  }
    /**
   * Check if all files have required metadata
   */
  areAllFilesValid(): boolean {
    return this.uploadedFiles.every(file => 
      file.category && file.category.trim() !== ''
    );
  }

  getMemberMasterClientList() {
    this.documentsReportsService.getClientFullList().subscribe((response: any) => {
      // console.log('full name list:', response);
      this.memberClientList = response.memberClients;
      this.masterClientList = response.masterClients;
      
      // If client name was passed in, pre-populate search
      if (this.data.clientName) {
        this.searchForm.patchValue({
          clientSearch: this.data.clientName
        });
      }
    });
  }
  
  // Search clients based on input and type selection
  searchClients(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredClients = [];
      return;
    }
    
    const clientType = this.searchForm.get('clientType')?.value;
    const sourceList = clientType === 'master' ? this.masterClientList : this.memberClientList;
    
    // Filter clients based on search term
    const searchTermLower = searchTerm.toLowerCase();
    const matchedClients = sourceList.filter(client => 
      client.ClientName.toLowerCase().includes(searchTermLower)
    );
    
    // Sort by relevance (closer match = higher rank)
    matchedClients.sort((a, b) => {
      const aNameLower = a.ClientName.toLowerCase();
      const bNameLower = b.ClientName.toLowerCase();
      
      // Exact match gets highest priority
      if (aNameLower === searchTermLower) return -1;
      if (bNameLower === searchTermLower) return 1;
      
      // Starts with gets second priority
      if (aNameLower.startsWith(searchTermLower) && !bNameLower.startsWith(searchTermLower)) return -1;
      if (bNameLower.startsWith(searchTermLower) && !aNameLower.startsWith(searchTermLower)) return 1;
      
      // Otherwise sort by alphabetical order
      return aNameLower.localeCompare(bNameLower);
    });
    
    // Take the top 5 results
    this.filteredClients = matchedClients.slice(0, 6);
  }
  
  // Select a client from the search results
  selectClient(client: clientListElement): void {
    this.selectedClient = client;
    // Clear the search results
    this.filteredClients = [];
    // Update the search form with the selected client's name
    this.searchForm.patchValue({
      clientSearch: client.ClientName
    });
    // Automatically go to next step (Upload Files)
    this.nextStep();
  }
  
  // Clear selected client
  clearSelectedClient(): void {
    this.selectedClient = null;
    this.searchForm.patchValue({
      clientSearch: ''
    });
  }  
  
  // region upload files to server
  onSubmit(): void {
    if (!this.selectedClient) {
      window.alert('Please select a client first');
      return;
    }
    
    if (this.uploadedFiles.length === 0) {
      window.alert('Please select at least one file to upload');
      return;
    }    
    // Check if all files have required metadata
    if (!this.areAllFilesValid()) {
      window.alert('Please ensure all files have a category selected');
      return;
    }
    
    this.isUploading = true;
    
    let completedUploads = 0;
    let failedUploads = 0;
    
    // Process each file in the upload list
    this.uploadedFiles.forEach((fileItem, index) => {
      // Skip files that have already been uploaded or have errors
      if (fileItem.progress === 100 || fileItem.error) {
        completedUploads++;
        return;
      }
      
      // Set file as uploading
      fileItem.isUploading = true;
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', fileItem.file);
      formData.append('clientName', this.selectedClient!.ClientName);
      formData.append('clientKey', this.selectedClient!.ClientKey);
      formData.append('clientId', this.selectedClient!.ClientId);
      formData.append('category', fileItem.category);
      formData.append('description', fileItem.description.trim() !== '' ? fileItem.description.trim() : fileItem.name);
      formData.append('userID', this.userID);

      console.log('clientName', this.selectedClient!.ClientName);
      console.log('clientKey', this.selectedClient!.ClientKey);
      console.log('clientId', this.selectedClient!.ClientId);
      console.log('fileName', fileItem.name);
      console.log('category', fileItem.category);
      console.log('description', fileItem.description);
      console.log('userID', this.userID);
      
      // Upload the file
      this.http.post('https://everest.revinc.com:4202/api/uploadClientDocument', formData, {
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: any) => {
          // Handle upload progress
          if (event.type === HttpEventType.UploadProgress) {
            fileItem.progress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            // Upload complete
            fileItem.progress = 100;
            fileItem.isUploading = false;
            completedUploads++;
            
            // Check if all uploads are completed
            if (completedUploads + failedUploads === this.uploadedFiles.length) {
              this.isUploading = false;
              if (failedUploads === 0) {
                this.dialogRef.close(true);
              }
            }
          }
        },
        error: (error) => {
          console.error(`Upload failed for ${fileItem.name}:`, error);
          fileItem.isUploading = false;
          fileItem.error = error.message || 'Upload failed';
          failedUploads++;
          
          // Check if all uploads are completed
          if (completedUploads + failedUploads === this.uploadedFiles.length) {
            this.isUploading = false;
          }
        }
      });
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Stepper navigation methods
  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex <= 2) {
      this.currentStep = stepIndex;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 0: // Select Master Client step
        return !!this.selectedClient;
      case 1: // Upload Files step
        return this.uploadedFiles.length > 0;
      case 2: // Files List step
        return this.areAllFilesValid();
      default:
        return false;
    }
  }

  getStepLabel(index: number): string {
    switch (index) {
      case 0: return 'Select Master Client';
      case 1: return 'Upload Files';
      case 2: return 'Files List';
      default: return '';
    }
  }
}
