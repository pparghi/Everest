import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { map, startWith, tap } from 'rxjs/operators';

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

  noaForm = new FormGroup({
    division: new FormControl('factors'), // Division field
    client: new FormControl<ClientInterface>({ ClientId: '', ClientKey: '', ClientName: '', MasterClientKey: '' }, [Validators.required]), // Client field
    contact: new FormControl<ContactInterface>({ Name: '' }), // Contact field
    debtor: new FormControl<DebtorInterface>({ DebtorKey: '', DebtorName: '', DebtorNo: '' }, [Validators.required]), // Debtor field
    ifNoBuySelection: new FormControl(''), // If No Buy Selection field
    reportFormat: new FormControl('DOC'), // Report Format field
  });


  filteredOptions: Observable<ClientInterface[]> | undefined;
  contactsOptions: Observable<ContactInterface[]> | undefined;
  debtorFilteredOptions: Observable<DebtorInterface[]> | undefined;
  clientOptions: ClientInterface[] = [];

  // inputs error type
  errorTypeClient: string = 'required';
  errorTypeDebtor: string = 'required';


  // constructor
  constructor(private http: HttpClient, private documentsReportsService: DocumentsReportsService) { }

  // #region onInit
  ngOnInit(): void {
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

  // #region submit Form
  onSubmit(event: Event): void {
    // check form inputs
    if (typeof (this.noaForm.value.client) === 'string') {
      if (this.noaForm.value.client === '') {
        this.errorTypeClient = 'required';
        this.noaForm.controls['client'].setErrors({ reqired: true });
        return;
      }
      else {
        this.errorTypeClient = 'error';
        this.noaForm.controls['client'].setErrors({ reqired: true });
        return;
      }
    }
    else {
      if (!this.noaForm.value.client?.ClientKey) {
        this.errorTypeClient = 'required';
        this.noaForm.controls['client'].setErrors({ reqired: true });
        return;
      }
    }

    if (typeof (this.noaForm.value.debtor) === 'string') {
      if (this.noaForm.value.debtor === '') {
        this.errorTypeDebtor = 'required';
        this.noaForm.controls['debtor'].setErrors({ reqired: true });
        return;
      }
      else {
        this.errorTypeDebtor = 'error';
        this.noaForm.controls['debtor'].setErrors({ reqired: true });
        return;
      }
    }
    else {
      if (!this.noaForm.value.debtor?.DebtorKey) {
        this.errorTypeDebtor = 'required';
        this.noaForm.controls['debtor'].setErrors({ reqired: true });
        return;
      }
    }
  }


}
