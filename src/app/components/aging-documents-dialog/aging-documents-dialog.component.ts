import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

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
  selector: 'app-aging-documents-dialog',
  templateUrl: './aging-documents-dialog.component.html',
  styleUrl: './aging-documents-dialog.component.css'
})
export class AgingDocumentsDialogComponent implements OnInit {
  userID: string = '';

  //#region View Documents Var
  agingDocumentListSource = new MatTableDataSource<any>([]);
  agingDocumentColumns: string[] = ['View', 'FileName', 'FileType', 'Descr', 'DropDate'];
  isLoading = false;

  //#endregion

  //#region Upload Documents Var
  uploadForm: FormGroup;
  isDragging = false;
  
  uploadedFiles: FileUploadItem[] = [];
  acceptedFileTypeArray: string[] = [
      "JPG", "JPEG", "PNG", "GIF", "TIFF", "BMP", "RAW", "SVG", 
      "TXT", "DOC", "DOCX", "PDF", "PAGES", "XLS", "XLSX", "PPT", "PPTX", "RTF", "CSV", "XML", "ODT",
      "EML", "MSG", "MBOX"
    ];
  acceptedFileTypes = this.acceptedFileTypeArray.map(ext => '.' + ext.toLowerCase()).join(',');

  isUploading = false;

  //#endregion



  constructor(
    public dialogRef: MatDialogRef<AgingDocumentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private documentsReportsService: DocumentsReportsService,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    
    this.uploadForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Initialize component data here
    this.isLoading = true;
    console.log('AgingDocumentsDialogComponent initialized with data:', this.data);
    
    // get userID
    this.http.get<{ mail?: string }>(GRAPH_ENDPOINT).subscribe(profile => {
      if (profile.mail) {
        this.userID = profile.mail.match(/^([^@]*)@/)?.[1] || '';
      } else {
        this.userID = 'Unknown';
      }
    });

    if (this.data.mode === 'view') {
      this.documentsReportsService.getRelationshipDocumentList(this.data.ticketingDetails.Client, this.data.ticketingDetails.Debtor, '').subscribe(
        (response: any) => {
          console.log('Fetched relationship document list:', response);
          // split file name to name and type
          let temp = response.data.map((item: any) => ({ ...item }));
          temp.forEach((element: any) => {
            if (element.FileName) {
              const fileParts = element.FileName.split('.');
              element.FileType = fileParts.length > 1 ? fileParts.pop().toUpperCase() : '';
              element.FileName = fileParts.join('.'); // Join the remaining parts as the name
            } else {
              element.FileType = '';
            }
          });
          this.agingDocumentListSource.data = temp;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error fetching relationship document list:', error);
          this.isLoading = false;
        }
      );
    }

  }

  onClose(): void {
    this.dialogRef.close();
  }

  // for now, all users can view files
  public canView(): boolean {
    return true;
  }
  
  
  //#region View functions
  // method for viewing file
  viewFile(element: any) {
    if (!this.canView()) {
      return; // Prevent restricted users from viewing files
    }

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

  //#endregion

  //#region Upload functions
   /**
   * Check if all files have required metadata
   */
  areAllFilesValid(): boolean {
    return this.uploadedFiles.every(file => 
      file.category && file.category.trim() !== ''
    );
  }
   /**
   * Get category description for display
   */
  getCategoryDescription(categoryKey: string): string {
    if (!categoryKey) return '';
    
    const category = this.data.categories.find((c: { DocCatKey: string; }) => c.DocCatKey === categoryKey);
    return category ? category.Descr : categoryKey;
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
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }
  /**
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

  // region upload files to server
  onSubmit(): void {
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
      formData.append('agingKey', this.data!.agingKey);
      formData.append('clientName', this.data!.ticketingDetails.Client);
      formData.append('clientKey', this.data!.ticketingDetails.ClientKey);
      formData.append('debtorName', this.data!.ticketingDetails.Debtor);
      formData.append('debtorKey', this.data!.ticketingDetails.DebtorKey);
      formData.append('category', fileItem.category);
      formData.append('description', fileItem.description.trim() !== '' ? fileItem.description.trim() : fileItem.name);
      formData.append('userID', this.userID);

      // console.log('--------------------------------');
      // console.log('agingKey', this.data!.agingKey);
      // console.log('clientName', this.data!.ticketingDetails.Client);
      // console.log('clientKey', this.data!.ticketingDetails.ClientKey);
      // console.log('debtorName', this.data!.ticketingDetails.Debtor);
      // console.log('debtorKey', this.data!.ticketingDetails.DebtorKey);
      // console.log('fileName', fileItem.name);
      // console.log('category', fileItem.category);
      // console.log('description', fileItem.description.trim() !== '' ? fileItem.description.trim() : fileItem.name);
      // console.log('userID', this.userID);
      
      // Upload the file
      this.http.post('https://everest.revinc.com:4202/api/uploadAgingDocument', formData, {
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

  //#endregion


}
