import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DebtorsApiService } from '../../services/debtors-api.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrl: './document-dialog.component.css',  
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDialogComponent {
  link: any;
  documentDescr: any;
  documentCategory: any;
  documentFolder: any;
  file!: File;
  path: any;
  ContactName: any;
  ContactEmail: any;
  ContactNo: any;

  contactColumns: string[] = ['name', 'email', 'contact_no'];
  contactDataSource = new MatTableDataSource<any>([]);

  editForm: FormGroup;

  constructor(private fb: FormBuilder,private http: HttpClient, private dataService: DebtorsApiService,private dialogRef: MatDialogRef<DocumentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {  
    this.editForm = this.fb.group({
      name: [data.name || '', Validators.required],
      description: [data.description || '']
    })
     
    if (data.documentsList) {
      this.data.documentsList.forEach((document: { FileName: string; Path: any; DocHdrKey: { toString: () => string; }; Link: string; }, index: any) => {
        const filename = document.FileName.split('.');
        const x = filename.length - 1;
        const link = `${document.Path}\\${document.DocHdrKey.toString().padStart(6, '0')}.${filename[x]}`;
        document.Link = btoa(link);
        this.link = document.Link
      }); 
     
      this.data.documentsFolder.forEach((docFolder: any) => {
        this.path = docFolder.Path
      });
    } else {
      this.dataService.getDebtorsContacts(data.DebtorKey).subscribe(response => {                                
        this.contactDataSource.data = response.debtorContactsData;
      });
    }
  }

  openFile(){
    // let url = atob(this.link);       
    // window.open("https://everest.revinc.com:4202/storage/uploads/");
    let url = 'https://login.baron.finance/iris/public/common/show_pdf.php?pdf=' + this.link;
    window.open(url);
    return false;
  }

  onFilechange(event: any) {
    console.log(event.target.files[0])
    this.file = event.target.files[0]
  }
 
    
  onSubmit() { 
    const DebtorKey = this.data.DebtorKey;
    const Descr = this.documentDescr;
    const DocCatKey = this.documentCategory;
    const DocFolderPath = this.path;
    const file = this.file;
    console.log(file);
    
    const formData = new FormData();
    formData.append('DebtorKey', DebtorKey);
    formData.append('Descr', Descr);
    formData.append('DocCatKey', DocCatKey);
    formData.append('DocFolderPath', DocFolderPath);
    formData.append('file', this.file);
    
    this.http.post('https://everest.revinc.com:4202/api/debtorMasterAddDocument', formData)
     .subscribe(response => {
       console.log('file uploaded',response);       
     }, error => {
       console.error('Upload failed', error);
     });
    }

    onEdit(){

    }
}
