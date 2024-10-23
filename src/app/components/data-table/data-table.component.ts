import { Component, OnInit, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { DebtorsApiService } from '../../services/debtors-api.service'; 
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
 selector: 'app-data-table',
 templateUrl: './data-table.component.html',
 styleUrls: ['./data-table.component.css']
})

export class DataTableComponent implements OnInit, AfterViewInit {
  math = Math;
  dtOptions: DataTablesModule = {};

 @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;

 dtTrigger: Subject<any> = new Subject<any>();
 data: any[] = [];

 constructor(private http: HttpClient, private dataService: DebtorsApiService, private router: Router){}

 ngOnInit(): void {
   this.dtOptions = {
     pagingType: 'full_numbers',
     pageLength: 25,
     ordering: true,
     serverSide: true,
     processing: true,
     stateSave: true,
     language: {
      
      zeroRecords: ""
     },     
     ajax: (dataTablesParameters: any, callback: (arg0: { recordsTotal: any; recordsFiltered: any; data: never[]; }) => void) => {
       this.dataService.getData(
        dataTablesParameters.mail,
        dataTablesParameters.start / dataTablesParameters.length + 1, 
        dataTablesParameters.length, dataTablesParameters.search.value,
        dataTablesParameters.columns[dataTablesParameters.order[0].column].data,
        dataTablesParameters.order[0].dir,
        dataTablesParameters.filterByBalance
        ).subscribe(resp => {
           this.data = resp.data;                      
           
           callback({
             recordsTotal: resp.total['count_all'],
             recordsFiltered: resp.total['count_all'],
             data: []
           });
         });
     },
     columns: [
      {
        title: '',
        data: 'DebtorKey'
      },
      {
        title: 'Debtor',
        data: 'Debtor'
      }
    ]
   };

  
  this.data.forEach((DebtorKey) => {
    DebtorKey.isExpanded = false;        
  });
  
 }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
  }

  openMembersWindow(DebtorKey: String): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/members'], { queryParams: { DebtorKey: DebtorKey } })
    );
    window.open(url, '_blank');
  }
}

