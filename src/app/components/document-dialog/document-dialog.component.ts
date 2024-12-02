import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DebtorsApiService } from '../../services/debtors-api.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { error, event } from 'jquery';
import { count, map } from 'rxjs/operators';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { LoginService } from '../../services/login.service';
// import imageCompression from 'browser-image-compression';

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
  debtor: any;

  contactColumns: string[] = ['name', 'email', 'contact_no'];
  paymentColumns: string[] = ['date', 'check#', 'amount'];
  miscDataColumns: string[] = ['element', 'value'];
  contactDataSource = new MatTableDataSource<any>([]);
  paymentDataSource = new MatTableDataSource<any>([]);
  MiscDataListDataSource = new MatTableDataSource<any>([]);
  ratesDataSource = new MatTableDataSource<any>([]);

  jpgDataUrl: string | ArrayBuffer | null = null;

  noaStatus = [
    { value: 'Not Sent', label: 'Not Sent' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Received', label: 'Received' }
  ]

  editForm!: FormGroup;
  changedNoaStatus!: string;    
  payment_images!: { fullname: string; basename: any; }[];
  
  constructor(private fb: FormBuilder,private http: HttpClient,private clientService: ClientsDebtorsService, private loginService: LoginService, private dataService: DebtorsApiService,private dialogRef: MatDialogRef<DocumentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    if(data.openForm){      

    if(data.Phone1.length == 11 || data.Phone2.length == 11){
      var Phone1 = data.Phone1.substring(1);
      var Phone2 = data.Phone2.substring(1);
    } else {
      Phone1 = data.Phone1;
      Phone2 = data.Phone2;
    }

    const roundThousandsPipe = new RoundThousandsPipe();
    var creditLimit = roundThousandsPipe.transform(data.TotalCreditLimit);
    
    this.editForm = this.fb.group({
      Debtor: [data.Debtor || '', Validators.required],
      Duns: [data.Duns || '', Validators.required],
      Addr1: [data.Addr1 || '', Validators.required],
      Addr2: [data.Addr2 || '', Validators.required],
      City: [data.City || '', Validators.required],
      State: [data.State || '', Validators.required],      
      Phone1: [Phone1 || '', Validators.required],
      Phone2: [Phone2 || '', Validators.required],
      TotalCreditLimit: [creditLimit || '', Validators.required],
      AIGLimit: [data.AIGLimit || '', Validators.required],
      Terms: [data.Terms || '', Validators.required]
    })

      console.log(data);
      this.debtor = data.Debtor
    } else if (data.documentsList) {
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
    } else if(data.DebtorPaymentsData) {
      this.clientService.getDebtorsPayments(data.DebtorKey, data.ClientKey).subscribe(response => {                                
        this.paymentDataSource.data = response.debtorPaymentsData;      
      });
    } else if(data.MiscDataList) {
      this.clientService.getMiscData(data.DebtorKey, data.ClientKey).subscribe(response => {                                
        this.MiscDataListDataSource.data = response.MiscDataList;      
      });
    } else if (data.exchangeRatesByMonth) {
      this.loginService.getExchangeRatesByMonth().subscribe(response => {                                
        this.ratesDataSource.data = response.exchangeRatesByMonth;
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
    this.file = event.target.files[0]
  }
 
    
  onSubmit() { 
    const DebtorKey = this.data.DebtorKey;
    const Descr = this.documentDescr;
    const DocCatKey = this.documentCategory;
    const DocFolderPath = this.path;
    const file = this.file;
    
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

    onChange(event: Event) {
      const selectElement = event.target as HTMLSelectElement;
        this.changedNoaStatus = selectElement.value
    }

    getPaymentsImage(event: any){        
      this.clientService.getDebtorsPaymentsImages(event.PmtChecksKey).subscribe(response => {                                
        response.debtorPaymentImages.forEach(async (element: any) => {               
          console.log(element.FileName);
          if (element.FileName && element.FileName.type === 'image/tiff') {
            // console.log("test");
            // try {
            //     const options = {
            //         maxSizeMB: 1,
            //         maxWidthOrHeight: 1920,
            //         useWebWorker: true
            //     };
            //     const compressedFile = await imageCompression(element.FileName, options);
            //     const reader = new FileReader();
            //     reader.onload = (e: any) => {
            //         this.jpgDataUrl = e.target.result;
            //     };
            //     reader.readAsDataURL(compressedFile);
            // } catch (error) {
            //     console.error('Error converting image:', error);
            // }
        }
        console.log('after ----',element.FileName);     
             window.open(`https://everest.revinc.com:4202/api/paymentsFiles/` + element.FileName);                       
          });                                  
        }
      );                        
    };  
}
