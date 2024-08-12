import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DebtorsApiService } from '../../services/debtors-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrl: './document-dialog.component.css',  
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDialogComponent {

  documentDescr: any;
  documentCategory: any;
  file!: FileList;

  constructor(private dataService: DebtorsApiService,private dialogRef: MatDialogRef<DocumentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {    
  }

  openFile(DocHdrKey: any){
    window.open();
  }

  onFilechange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
      if (inputElement?.files && inputElement.files.length > 0) {
    	  this.file = inputElement.files;        
      }      
    }
    
  onSubmit() { 
    const DebtorKey = this.data.DebtorKey;
    const Descr = this.documentDescr;
    const FileName = 'test.pdf';
    const DocCatKey = this.documentCategory;
    
    this.dataService.uploadDocument(DebtorKey, Descr, FileName, DocCatKey).subscribe(
      response => { 
        Swal.fire('Thank you!','Document Uploaded succesfully!', 'success');       
      },
      error => {
        Swal.fire('Oops!','Document Upload Failed!', 'error');                   
      }
    );      
    this.dialogRef.close({ documentCategory: this.documentCategory, file: this.file, documentDescr: this.documentDescr });

  }
}
