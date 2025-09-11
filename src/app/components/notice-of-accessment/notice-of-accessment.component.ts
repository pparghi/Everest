import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import {Observable} from 'rxjs';
import {map, startWith, tap} from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

export interface ClientInterface {
  ClientId: string;
  ClientName: string;
  ClientKey: string;
  MasterClientKey: string;
}
export interface DebtorInterface {
  DebtorKey: string;
  DebtorName: string;
  DebtorNo: string;
}

@Component({
  selector: 'app-notice-of-accessment',
  templateUrl: './notice-of-accessment.component.html',
  styleUrl: './notice-of-accessment.component.css',
})
export class NoticeOfAccessmentComponent implements OnInit {
   // Define a FormGroup to manage multiple form controls
   noaForm = new FormGroup({
    client: new FormControl<ClientInterface>({ClientId:'', ClientKey:'', ClientName:'', MasterClientKey:''}, [Validators.required]), // Client field
    debtor: new FormControl<DebtorInterface>({DebtorKey:'', DebtorName:'', DebtorNo:''}, [Validators.required]), // Debtor field
    factorSignature: new FormControl(false), // FormControl for the Factor Signature radio buttons
  });
  clientOptions: ClientInterface[] = [];
  debtorOptions: DebtorInterface[] = [];
  filteredOptions: Observable<ClientInterface[]> | undefined;
  debtorFilteredOptions: Observable<DebtorInterface[]> | undefined;

  // inputs error type
  errorTypeClient: string = 'required';
  errorTypeDebtor: string = 'required';
  // Parameter to control button state
  isEmailButtonEnabled: boolean = true; 

  // user profile
  userID: string = '';
  userName: string = '';
  userEmail: string = '';
  userExt: string = '';

  @Input() userPermissionsDisctionary: any = {}; // get user permissions from parent component

  // Helper method to get user access level, only two levels in this page which are PDF and Full
  public userAccessLevel(): string {
    if (this.userPermissionsDisctionary['Everest Documents NOA']?.['Full'] === 1) {
      return 'Full';
    }
    else if (this.userPermissionsDisctionary['Everest Documents NOA']?.['PDF'] === 1) {
      return 'PDF';
    }
    else {
      return 'No Access';
    }
  }

  // constructor
  constructor(private http: HttpClient, private documentsReportsService: DocumentsReportsService, private addNoteService: RiskMonitoringService) {}

  ngOnInit(): void {
    this.http.get(GRAPH_ENDPOINT)
    .subscribe(profile => {
      console.log('User profile:', profile);
      this.userID = (profile as any).mail.match(/^([^@]*)@/)[1].toUpperCase();
      this.userName = (profile as any).displayName;
      this.userEmail = (profile as any).mail;
      this.userExt = (profile as any).businessPhones[0].replace("e", "E").replace("=", ". ");
    });
    // Fetch the client list when the component is initialized
    this.documentsReportsService.getClientsList().subscribe(
      (response: any) => {
        this.clientOptions = response.data;
        this.filteredOptions = this.noaForm.controls['client'].valueChanges.pipe(
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
    this.noaForm.controls['client'].valueChanges.subscribe(value => {
      if (typeof value === 'object' && value?.ClientKey) {
        this.documentsReportsService.getNOADebtorsListByClientKey(parseInt(value.ClientKey)).subscribe(
          (response: any) => {
            // console.log('Debtor list response:', response);
            this.debtorOptions = [{DebtorNo: 'All Debtors', DebtorName: 'All Debtors', DebtorKey: 'All Debtors'}].concat(response.data);
            this.debtorFilteredOptions = this.noaForm.controls['debtor'].valueChanges.pipe(
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
  }

  displayClientName(user: ClientInterface): string {
    return user && user.ClientName ? user.ClientName : '';
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

  
  // #region submit form
  // use IRIS API for creating PDF files
  onSubmit(event: Event): void {
    // console.log('Form Submitted: ', this.noaForm.value.client, this.noaForm.value.debtor, this.noaForm.value.factorSignature);
    // check form inputs
    if (typeof(this.noaForm.value.client) === 'string'){
      if (this.noaForm.value.client === '') {
        this.errorTypeClient = 'required';
        this.noaForm.controls['client'].setErrors({reqired: true});
        return;
      }
      else {
        this.errorTypeClient = 'error';
        this.noaForm.controls['client'].setErrors({reqired: true});
        return;
      }
    }
    else {
      if (!this.noaForm.value.client?.ClientKey){
        this.errorTypeClient = 'required';
        this.noaForm.controls['client'].setErrors({reqired: true});
        return;
      }
    }
    
    if (typeof(this.noaForm.value.debtor) === 'string'){
      if (this.noaForm.value.debtor === '') {
        this.errorTypeDebtor = 'required';
        this.noaForm.controls['debtor'].setErrors({reqired: true});
        return;
      }
      else {
        this.errorTypeDebtor = 'error';
        this.noaForm.controls['debtor'].setErrors({reqired: true});
        return;
      }
    }
    else {
      if (!this.noaForm.value.debtor?.DebtorKey){
        this.errorTypeDebtor = 'required';
        this.noaForm.controls['debtor'].setErrors({reqired: true});
        return;
      }
    }

    const target = event.target as HTMLButtonElement;
    const buttonValue = (target.querySelector('button[type="submit"]:focus') as HTMLButtonElement)?.value;
    // when click create PDF button
    if (buttonValue === 'createIndividualPDF') {
      if (this.noaForm.value.debtor.DebtorKey === 'All Debtors') {
        this.errorTypeDebtor = 'notAll';
        this.noaForm.controls['debtor'].setErrors({reqired: true});
        return;
      }
      this.documentsReportsService.callNOAIRISAPI(parseInt(this.noaForm.value.client?.ClientKey ?? ''), this.noaForm.value.debtor?.DebtorKey ?? '', this.noaForm.value.factorSignature??false,true,false,true,false,false,false,false,'','','','').subscribe(
        (response: any) => {
          // Handle the response from the API
          this.openBase64Pdf(response.result, "NOA-"+this.noaForm.value.client?.ClientName+"-"+this.noaForm.value.debtor?.DebtorName);
          // this.openBase64Pdf(response.result.replace(/\\/g, '')); // cleanout the PDF base64 string, replace all \ with empty char
        }
      );
    }
    if (buttonValue === 'emailAllDebtors' && this.userAccessLevel() === 'Full') {
      let debtorKeyArray = [];
      if (this.noaForm.value.debtor.DebtorKey === 'All Debtors') {
        debtorKeyArray = this.debtorOptions.filter((debtor) => debtor.DebtorKey !== 'All Debtors');
      }
      else {
        debtorKeyArray = [this.noaForm.value.debtor];
      }
      // send email to one debtor
      let confirmed = false;
      let successDebtors:string[] = [];
      let failedDebtors:string[] = [];
      if (debtorKeyArray.length === 1) {
        confirmed = window.confirm('Are you sure you want to send NOA email to ' + debtorKeyArray[0].DebtorName + '?'); // Add confirmation popup
      }
      // send email to all debtors
      else {
        confirmed = window.confirm('Are you sure you want to send NOA emails to ' + debtorKeyArray.length + ' debtors?'); // Add confirmation popup
      }
      if (confirmed) {
        this.isEmailButtonEnabled = false; // Disable the button

        // add note when there is 0 debtor
        if (debtorKeyArray.length === 0) {
          // Add note even when there are no debtors
          const noteMessage = `${this.noaForm.value.client?.ClientName}: NOA PDFs Created 0, Emailed 0`;
          this.addNoteService.addNotesRisk(
            this.noaForm.value.client?.MasterClientKey ?? '', 'Other', noteMessage, '', '1', this.userID, ''
          ).subscribe({
            next: (response) => {
              console.log('Note added successfully:', response);
              this.isEmailButtonEnabled = true;
            },
            error: (error) => {
              alert('Failed adding note');
              this.isEmailButtonEnabled = true;
            }
          });
          return;
        }

        // check validations of email contact name(user's name) and contact email(user's email)
        if (this.userName === '' || this.userEmail === '') {
          window.alert('Please check your user profile, contact name and email are required to send emails.');
          return; // stop sending emails when userName or userEmail is empty
        }
        // Create an array of NOA API call observables
        // const apiCalls = debtorKeyArray.map((debtor) =>
        //   this.documentsReportsService.callNOAIRISAPI(parseInt(this.noaForm.value.client?.ClientKey ?? ''), parseInt(debtor.DebtorKey), this.noaForm.value.factorSignature ?? false, true, false, true, false, true, false, false, '', this.userName, this.userEmail, this.userExt)
        //     .pipe(
        //       tap((response: any) => {
        //         // Handle the response from the API
        //         if (response.resultType==='email_sent' && response.result === 'success') {
        //           successDebtors.push(debtor.DebtorName);
        //         }
        //         else {
        //           failedDebtors.push(debtor.DebtorName);
        //         }
        //       }),
        //       catchError((error) => {
        //         console.error(`Error sending email to debtor ${debtor.DebtorName}:`, error);
        //         return of(null); // Return a null value to continue processing other calls
        //       })
        //     )
        // );
        // // Use forkJoin to wait for all API calls to complete
        // forkJoin(apiCalls).subscribe(
        //   (responses) => {
        //     // Handle all responses here
        //     // #region add notes
        //     const noteMessage = ''+this.noaForm.value.client?.ClientName + ": NOA PDFs Created " + debtorKeyArray.length + ", Emailed " + successDebtors.length;
        //     this.addNoteService.addNotesRisk(this.noaForm.value.client?.MasterClientKey??'', 'Other', noteMessage, '', '1', this.userID, '').subscribe(response => {      
        //       console.log('Note added successfully:', response);
        //     }, error => {
        //       alert('Failed adding note');
        //     });

        //     console.log('All responses received:', responses);
        //     window.alert('All emails have been sent!\n' +
        //       'Success: ' + successDebtors.join(', ') + '\n' + 
        //       'Failed: ' + failedDebtors.join(', '));
        //       this.isEmailButtonEnabled = true; // Re-enable the button
        //   },
        //   (error) => {
        //     console.error('Error sending emails:', error);
        //     window.alert('An error occurred while sending emails.');
        //     this.isEmailButtonEnabled = true; // Re-enable the button
        //   }
        // );

        let tempDebtorKeyArr = debtorKeyArray.map(debtor => debtor.DebtorKey.trim());

        this.documentsReportsService.callNOAIRISAPISendBulkEmail(parseInt(this.noaForm.value.client?.ClientKey ?? ''), tempDebtorKeyArr.join(','), this.noaForm.value.factorSignature ?? false, true, false, true, false, true, false, false, '', this.userName, this.userEmail, this.userExt);
        window.alert(
          "Your request has been submitted successfully.\n" +
          "Please check your inbox for result and the client's notes for results in a few minutes."
        );
        this.isEmailButtonEnabled = true; // Re-enable the button
      }
    }

  }
  // #endregion create PDF


  // #region template PDF
  /* Use html template to create PDF
  
  modifyTemplate( htmlStr: string): string {
    // Get the selected client and debtor values from the form
    const client = this.noaForm.value.client;
    const debtor = this.noaForm.value.debtor;
    const factorSignature = this.noaForm.value.factorSignature;

    let result = htmlStr
      .replace('{{CLIENT_NAME}}', this.noaForm.value.client || '')
      .replace('{{PAYER_NAME}}', this.noaForm.value.debtor || '');

    if (factorSignature) {
      result = result.replace('{{FACTOR_SIGNATORY}}', 'Michael Lukhton, CFO');
      result = result.replace('{{FACTOR_COMPANY}}', '$OfficeName');
    } else {
      result = result.replace('{{FACTOR_SIGNATORY}}', '');
      result = result.replace('{{FACTOR_COMPANY}}', '');
    }

    return result;
  }

  onSubmit(): void {
    // console.log('Form Submitted');
    // console.log('noa formgroup:', this.noaForm.value);

    // Load the HTML template
    this.http.get('assets/NOA_templates/idcnoa.en.ca.1.html', { responseType: 'text' }).subscribe((htmlTemplate) => {
      // Replace placeholders in the template with form values
      const filledTemplate = this.modifyTemplate(htmlTemplate);

      // Create a container to render the HTML template
      const container = document.createElement('div');
      container.setAttribute("id", "NOA-PDF-canvas");
      container.innerHTML = filledTemplate;
      // container.style.position = 'absolute';
      // container.style.top = '-9999px'; 
      document.body.appendChild(container);

      // Use html2canvas to render the container into a canvas
      html2canvas(container, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'letter');

        // Calculate dimensions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);


        // Add a new page for the BOA.png image
        pdf.addPage(); // Create a new page
        const img = new Image();
        img.src = 'assets/NOA_templates/BOA.png'; // Path to the BOA.png image
        img.onload = () => {
          // Add the BOA.png image to the second page
          pdf.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);

          
          // Save or open the PDF
          // pdf.save('document.pdf');
          window.open(URL.createObjectURL(pdf.output("blob")));

          // Clean up the container
          // document.body.removeChild(container);
        };

      });
    });

  }
    */
   // #endregion template PDF
}
