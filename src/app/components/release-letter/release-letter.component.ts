import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { map, startWith, tap } from 'rxjs/operators';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

export interface ClientInterface {
  ClientId: string;
  ClientName: string;
  ClientKey: string;
  MasterClientKey: string;
}
export interface ContactInterface {
  Name: string;
}
export interface DebtorInterface {
  DebtorKey: string;
  DebtorName: string;
  DebtorNo: string;
}


@Component({
  selector: 'app-release-letter',
  templateUrl: './release-letter.component.html',
  styleUrl: './release-letter.component.css'
})


export class ReleaseLetterComponent implements OnInit {

  releaseLetterForm = new FormGroup({
    // division: new FormControl('factors'), // Division field
    client: new FormControl<ClientInterface>({ ClientId: '', ClientKey: '', ClientName: '', MasterClientKey: '' }, [Validators.required]), // Client field
    // contact: new FormControl<ContactInterface>({ Name: '' }), // Contact field
    debtor: new FormControl<DebtorInterface>({ DebtorKey: '', DebtorName: '', DebtorNo: '' }), // Debtor field
    ifNoBuySelection: new FormControl('false'), // If No Buy Selection field
    reportFormat: new FormControl('PDF'), // Report Format field
  });


  filteredOptions: Observable<ClientInterface[]> | undefined;
  contactsOptions: Observable<ContactInterface[]> | undefined;
  debtorFilteredOptions: Observable<DebtorInterface[]> | undefined;
  clientOptions: ClientInterface[] = [];
  debtorOptions: DebtorInterface[] = [];

  // inputs error type
  errorTypeClient: string = 'required';
  errorTypeDebtor: string = 'required';

  showEmailAllButton: boolean = false; // show email all button when all debtors are selected
  isEmailButtonEnabled: boolean = true; // disable email all button when waiting for response

  // user profile
  userExt: string = '';

  // constructor
  constructor(private http: HttpClient, private documentsReportsService: DocumentsReportsService) { }

  // #region onInit
  ngOnInit(): void {
    this.http.get(GRAPH_ENDPOINT)
    .subscribe(profile => {
      this.userExt = (profile as any).businessPhones[0].replace("e", "E").replace("=", ". ");
    });
    // Fetch the client list when the component is initialized
    this.documentsReportsService.getClientsList().subscribe(
      (response: any) => {
        this.clientOptions = response.data;
        this.filteredOptions = this.releaseLetterForm.controls['client'].valueChanges.pipe(
          startWith(''),
          map(value => {
            const name = typeof value === 'string' ? value : value?.ClientName;
            return name ? this._filter(name as string) : this.clientOptions.slice();
          }),
        );
      },
      (error) => {
        console.error('Error fetching client list:', error);
      }
    );

    // Fetch the debtor list when cllient is selected
    this.releaseLetterForm.controls['client'].valueChanges.subscribe(value => {
      if (typeof value === 'object' && value?.ClientKey) {
        this.documentsReportsService.getDebtorsListByClientKey(parseInt(value.ClientKey)).subscribe(
          (response: any) => {
            console.log('Debtor list response:', response);
            this.debtorOptions = [{DebtorNo: 'All Debtors', DebtorName: 'All Debtors', DebtorKey: 'All Debtors'}].concat(response.data);
            this.debtorFilteredOptions = this.releaseLetterForm.controls['debtor'].valueChanges.pipe(
              startWith(''),
              map(value => {
                const name = typeof value === 'string' ? value : value?.DebtorName;
                return name ? this._debtorFilter(name as string) : this.debtorOptions.slice();
              }),
            );
          },
          (error) => {
            console.error('Error fetching debtor list:', error);
          }
        );

      }
    });

    // show email all button when all debtors is selected
    this.releaseLetterForm.controls['debtor'].valueChanges.subscribe(value => {
      if (typeof value === 'object' && value?.DebtorKey === 'All Debtors') {
        this.showEmailAllButton = true;
      }
      else {
        this.showEmailAllButton = false;
      }
      if (this.isWatermarkDisabled() && 
        this.releaseLetterForm.controls['reportFormat'].value === 'PDFWithWatermark') {
        // Reset report format if watermark is selected but not allowed
        this.releaseLetterForm.controls['reportFormat'].setValue('PDF', { emitEvent: false });
      }
    });

    // if debtor selection is null or all debtors, only PDF is available
    this.releaseLetterForm.controls['reportFormat'].valueChanges.subscribe(value => {
      if (value === 'PDFWithWatermark') {
      if (this.isWatermarkDisabled()) {
        // Prevent infinite loop by using emitEvent: false
        this.releaseLetterForm.controls['reportFormat'].setValue('PDF', { emitEvent: false });
      }
    }
    });

  }

  displayClientName(user: ClientInterface): string {
    return user && user.ClientName ? user.ClientName : '';
  }
  
  displayContactName(user: ContactInterface): string {
    return user && user.Name ? user.Name : '';
  }

  displayDebtorName(user: DebtorInterface): string {
    return user && user.DebtorName ? user.DebtorName : '';
  }

  private _filter(name: string): ClientInterface[] {
    const filterValue = name.toLowerCase();

    return this.clientOptions.filter(option => option.ClientName.toLowerCase().includes(filterValue));
  }

  private _debtorFilter(name: string): DebtorInterface[] {
    const filterValue = name.toLowerCase();

    return this.debtorOptions.filter(option => option.DebtorName.toLowerCase().includes(filterValue));
  }

  isWatermarkDisabled(): boolean {
    const tempDebtor = this.releaseLetterForm.controls['debtor'].value;
    return !tempDebtor || typeof tempDebtor === 'string' || 
          tempDebtor?.DebtorKey === '' || tempDebtor?.DebtorKey === 'All Debtors';
  }

  // #region open PDF
  openBase64Pdf(base64String: string, fileName: string): void {
    // Decode the Base64 string and create a Blob
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Create a URL for the Blob
    const blobUrl = URL.createObjectURL(blob);

    // console.log('Blob URL:', blobUrl);
    // Open the PDF in a new tab
    const newTab = window.open('', '_blank');

    if (!newTab) {
      console.error('Failed to open new tab. Popup blocker might be enabled.');
      return;
    }

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

  // #region submit Form
  onSubmit(event: Event): void {
    // check form inputs
    if (typeof (this.releaseLetterForm.value.client) === 'string') {
      if (this.releaseLetterForm.value.client === '') {
        this.errorTypeClient = 'required';
        this.releaseLetterForm.controls['client'].setErrors({ reqired: true });
        return;
      }
      else {
        this.errorTypeClient = 'error';
        this.releaseLetterForm.controls['client'].setErrors({ reqired: true });
        return;
      }
    }
    else {
      if (!this.releaseLetterForm.value.client?.ClientKey) {
        this.errorTypeClient = 'required';
        this.releaseLetterForm.controls['client'].setErrors({ reqired: true });
        return;
      }
    }

    let debtorKeyValue = this.releaseLetterForm.value.debtor;
    let debtorKeyParameter;
    if (debtorKeyValue && typeof debtorKeyValue === 'string') {
      if ((debtorKeyValue as string).trim() === '') {
        debtorKeyParameter = 0;
      }
      else {
        this.errorTypeDebtor = 'error';
        this.releaseLetterForm.controls['debtor'].setErrors({ reqired: true });
        return;
      }
    }
    else if (debtorKeyValue?.DebtorKey === ''){
      debtorKeyParameter = 0;
    }
    else if (debtorKeyValue?.DebtorKey === 'All Debtors'){
      debtorKeyParameter = 0;
    }
    else {
      debtorKeyParameter = parseInt(debtorKeyValue?.DebtorKey ?? '0');
    }

    // console.log('Debtor:', this.releaseLetterForm.value.debtor);
    // console.log('Debtor pass:', debtorKeyParameter);

    // #region call LOR API
    const target = event.target as HTMLButtonElement;
    const buttonValue = (target.querySelector('button[type="submit"]:focus') as HTMLButtonElement)?.value;

    if (buttonValue === 'createSingleReleaseLetter') {
      this.documentsReportsService.callLORCreatePDFAPI(parseInt(this.releaseLetterForm.value.client?.ClientKey ?? ''), debtorKeyParameter, this.releaseLetterForm.value.ifNoBuySelection==="true"?true:false, this.releaseLetterForm.value.reportFormat==="PDFWithWatermark"?true:false).subscribe(
        (response: any) => {
          // console.log('LOR API response:', response);
          // Handle the response from the API
          this.openBase64Pdf(response.pdfb64, response.pdfname);
        }
      );
    }
    else if (buttonValue === 'emailReleaseLettersToDebtors') {
      this.isEmailButtonEnabled = false;
      // console.log('callLORCreatePDFsAPI: ', parseInt(this.releaseLetterForm.value.client?.ClientKey ?? ''),' , ', this.releaseLetterForm.value.ifNoBuySelection==="true"?true:false,' , ', this.releaseLetterForm.value.reportFormat==="PDFWithWatermark"?true:false, ' , ', true);
      this.documentsReportsService.callLORCreatePDFsAPI(parseInt(this.releaseLetterForm.value.client?.ClientKey ?? ''), this.releaseLetterForm.value.ifNoBuySelection==="true"?true:false, this.releaseLetterForm.value.reportFormat==="PDFWithWatermark"?true:false, true, this.userExt).subscribe(
        (response: any) => {
          this.isEmailButtonEnabled = true;
          // Handle the response from the API
          if (response.status === 'success') {
            window.alert('All emails have been sent!\n'
              + response.message + '\n'
            );
          } else {
            window.alert('An error occurred while sending emails.');
          }
        }
      );
    }




  }


}
