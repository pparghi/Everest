import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsDebtorsService } from '../../services/clients-debtors.service';
import { LoginService } from '../../services/login.service';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-master-debtor-edit',
  templateUrl: './master-debtor-edit.component.html',
  styleUrl: './master-debtor-edit.component.css'
})
export class MasterDebtorEditComponent implements OnInit {

  editForm!: FormGroup;
  debtor: any;
  data: any

  constructor(private fb: FormBuilder,private http: HttpClient, private route: ActivatedRoute, private dataService: DebtorsApiService) {}

  ngOnInit(){
    this.data = this.dataService.getEditData()
    if(this.data.Phone1.length == 11 || this.data.Phone2.length == 11){
      var Phone1 = this.data.Phone1.substring(1);
      var Phone2 = this.data.Phone2.substring(1);
    } else {
      Phone1 = this.data.Phone1;
      Phone2 = this.data.Phone2;
    }

    const roundThousandsPipe = new RoundThousandsPipe();
    var creditLimit = roundThousandsPipe.transform(this.data.TotalCreditLimit);
    
    this.editForm = this.fb.group({
      Debtor: [this.data.Debtor || '', Validators.required],
      Duns: [this.data.Duns || '', Validators.required],
      Addr1: [this.data.Addr1 || '', Validators.required],
      Addr2: [this.data.Addr2 || '', Validators.required],
      City: [this.data.City || '', Validators.required],
      State: [this.data.State || '', Validators.required],      
      Phone1: [Phone1 || '', Validators.required],
      Phone2: [Phone2 || '', Validators.required],
      TotalCreditLimit: [creditLimit || '', Validators.required],
      AIGLimit: [this.data.AIGLimit || '', Validators.required],
      Terms: [this.data.Terms || '', Validators.required]
    })

      this.debtor = this.data.Debtor
    
  }

  handleAddressChange(event: any) { 
    const address = event.formatted_address; 
    this.data.Addr1 = address; 
  }

  onEdit(){

  }
    
}
