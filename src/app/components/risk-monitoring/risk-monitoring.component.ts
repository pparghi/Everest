import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { MatTableDataSource } from '@angular/material/table';

interface DataItem {
  Client: string,
  expandedDetail: { detail: string };
}

@Component({
  selector: 'app-risk-monitoring',
  templateUrl: './risk-monitoring.component.html',
  styleUrl: './risk-monitoring.component.css'
})

export class RiskMonitoringComponent implements OnInit {

  filter: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  isActive = '0';
  isLoading = true;
  dataSource = new MatTableDataSource<any>();
  totalRecords = 0;
  displayedColumns: string[] = ['expand', 'Client', 'Level', 'CRM','A/R', 'NFE', 'Ineligibles', 'Reserves', 'Availability'];
  expandedElement: DataItem | null = null;
  isDDSelect!: string;
  isDDCreatedBy!: string;
  
  constructor(private dataService: RiskMonitoringService) { 
    
  }

  ngOnInit(): void {    
    this.loadData();      
  }

  loadData(): void {
    // this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
    //   this.profile = profile;
    //   this.loginService.getData(this.profile.mail).subscribe(response => {                                
    //     response.data.forEach((element: any) => {
    //       if (element.NavOption == 'Master Debtor') {            
    //         this.NavOptionMasterDebtor = element.NavOption;          
    //         this.NavAccessMasterDebtor = element.NavAccess;
    //       } else if (element.NavOption == 'Client Risk Page'){
    //         this.NavOptionClientRisk = element.NavOption;          
    //         this.NavAccessClientRisk = element.NavAccess;
    //       } else if (element.NavOption == 'Update Master Debtor'){
    //         this.NavOptionUpdateMasterDebtor = element.NavOption;          
    //         this.NavAccessUpdateMasterDebtor = element.NavAccess;
    //       } else {
    //         this.NavOptionMasterDebtor = '';
    //         this.NavAccessMasterDebtor = '';
    //         this.NavOptionClientRisk = '';
    //         this.NavAccessClientRisk = '';       
    //         this.NavOptionUpdateMasterDebtor = '';       
    //         this.NavAccessUpdateMasterDebtor = '';       
    //       }                                           
                      
    //     });
    //   }, error => {
    //     console.error('error--', error);
    //   });

    //   this.isLoading = true;      
    //   let sort = this.sort ? this.sort.active : 'Balance';
    //   let order = this.sort ? this.sort.direction : 'DESC';
    //   const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
    //   const pageSize = this.paginator ? this.paginator.pageSize : 25;

    //   const mail = btoa(this.profile.mail);        

    //   let filterByBalance = '';

    //   if (this.filterByBalance == 'Balance') {
    //     filterByBalance = 'balance';
    //   } 
      
      this.dataService.getData(this.isActive).subscribe(response => {                
        this.isLoading = false;
      
        this.dataSource.data = response.data;
        response.data.forEach((element: any) => {
          const total = element.total;          
          this.totalRecords = total;                
        });                             
      });    
  }

  onChangeIsActive(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }

  onChangeDDSelect(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isDDSelect = selectElement.value   
      this.loadData();
  }

  onChangeDDCreatedBy(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isDDCreatedBy = selectElement.value   
      this.loadData();
  }

  onChangeLevel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }

  onChangeOffice(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }

  onChangeCRM(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }

  onChangeFuel(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.isActive = selectElement.value   
      this.loadData();
  }  

  toggleRow(element: DataItem): void {                        
    this.expandedElement = this.expandedElement === element ? null : element;       
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filter = filterValue.trim().toLowerCase(); 
    this.paginator.pageIndex = 0;     
  }

  isExpanded(element: DataItem): boolean {
    return this.expandedElement === element;
  }

  isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');
}
function strtotime(arg0: string): any {
  throw new Error('Function not implemented.');
}

