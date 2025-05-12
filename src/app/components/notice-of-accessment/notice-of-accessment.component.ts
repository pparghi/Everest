import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-notice-of-accessment',
  templateUrl: './notice-of-accessment.component.html',
  styleUrl: './notice-of-accessment.component.css',
})
export class NoticeOfAccessmentComponent {
   // Define a FormGroup to manage multiple form controls
   noaForm = new FormGroup({
    client: new FormControl(''), // Client field
    debtor: new FormControl(''), // Debtor field
    factorSignature: new FormControl(false), // FormControl for the Factor Signature radio buttons
  });
  clientOptions: string[] = ['Client One', 'Client Two', 'Client Three'];
  debtorOptions: string[] = ['Debtor One', 'Debtor Two', 'Debtor Three'];

  // constructor
  constructor(private http: HttpClient, private documentsReportsService: DocumentsReportsService) {}




  openBase64Pdf(base64String: string): void {
    // Decode the Base64 string and create a Blob
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Create a URL for the Blob
    const blobUrl = URL.createObjectURL(blob);

    // Open the PDF in a new tab
    window.open(blobUrl, '_blank');

    // Optionally, revoke the object URL after some time to free up memory
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  
  // #region create PDF
  // use IRIS API for creating PDF files
  onSubmit(): void {
    // const base64Pdf = "JVBERi0xLjQKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoK MiAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoz IDAgb2JqCjw8L1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQy XQovQ29udGVudHMgNSAwIFIKL1Jlc291cmNlcyA8PC9Qcm9jU2V0IFsvUERGIC9UZXh0XQovRm9u dCA8PC9GMSA0IDAgUj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUgL0ZvbnQKL1N1YnR5 cGUgL1R5cGUxCi9OYW1lIC9GMQovQmFzZUZvbnQgL0hlbHZldGljYQovRW5jb2RpbmcgL01hY1Jv bWFuRW5jb2RpbmcKPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDUzCj4+CnN0cmVhbQpCVAov RjEgMjAgVGYKMjIwIDQwMCBUZAooRHVtbXkgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhy ZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA2MyAw MDAwMCBuCjAwMDAwMDAxMjQgMDAwMDAgbgowMDAwMDAwMjc3IDAwMDAwIG4KMDAwMDAwMDM5MiAw MDAwMCBuCnRyYWlsZXIKPDwvU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTUKJSVF T0YK"; // Replace with your Base64-encoded PDF string
    // this.openBase64Pdf(base64Pdf);

    this.documentsReportsService.callNOAIRISAPI(11568, 72020, 1).subscribe(
      (response: any) => {  
        // Handle the response from the API
        // console.log('API Response:', response.result.replace(/\\/g, ''));
        this.openBase64Pdf(response.result.replace(/\\/g, ''));
      }
    );

  }
  // #endregion create PDF


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
}
