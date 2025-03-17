import { Component } from '@angular/core';
import { AddressService } from '../../services/address.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css'
})

export class InvoicesComponent {
//  query: string = '';
//  suggestions: any[] = [];
//  private searchSubject = new Subject<string>();
//  constructor(private addressService: AddressService) {
//   // this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
//   //   this.fetchAddressSuggestions(query);
//   // });
//   this.searchSubject.pipe(debounceTime(1000),
//   distinctUntilChanged(),
//   switchMap(query => {
//     console.log("Fetching suggestsions for : ", query);
//     return this.addressService.getAddressSuggestions(query);
//   })
//   ).subscribe( {
//     next: (data) => {
//       console.log("API Response:", data);
//       if (data.Items) {
//         this.suggestions = data.Items.map((item: any) => ({
//           text: item.Text,
//           description: item.Description
//         }));
//       } else {
//         this.suggestions = [];
//       }
//     },
//     error: (error) => {
//       console.error('Error fetching address suggestions: ', error);
//     }
//   });
//  }
 
//  onQueryChange() {
//    console.log("query changed:", this.query);

//   if (this.query.length > 2) {
//     console.log("lendth > called");
//     this.searchSubject.next(this.query);
//   } else {
//     console.log("else part to clear suggestions");
//     this.suggestions = []; // Clear suggestions when query is too short
//   }
//  }
 
// //  fetchAddressSuggestions(query: string) {
// //   this.addressService.getAddressSuggestions(query).subscribe({
// //     next: (data) => {
// //       if (data.Items) {
// //         this.suggestions = data.Items.map((item: any) => ({
// //           text: item.Text,
// //           description: item.Description
// //         }));
// //       }
// //     },
// //     error: (error) => {
// //       console.error('Error fetching address suggestions:', error);
// //     }
// //   });
// // }
// selectSuggestion(suggestion: any) {
//   this.query = suggestion.text + suggestion.description;
//   this.suggestions = [];
// }
}