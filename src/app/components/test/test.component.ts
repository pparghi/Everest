import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  selectedFile: File | null = null;
 constructor(private http: HttpClient) {}
 onFileSelect(event: Event): void {
   const input = event.target as HTMLInputElement;
   if (input.files && input.files.length > 0) {
     this.selectedFile = input.files[0];
   }
 }
 onSubmit(): void {
   if (this.selectedFile) {
     const formData = new FormData();
     formData.append('file','test');
     console.log(formData);
     
     this.http.post('http://127.0.0.1:4201/api/debtorMasterAddDocument', formData,  { headers: { 'Content-Type': 'multipart/form-data' } })
     .subscribe(response => {
       console.log('file uploaded',response);       
     }, error => {
       console.error('Upload failed', error);
     });
   }
 }
}

