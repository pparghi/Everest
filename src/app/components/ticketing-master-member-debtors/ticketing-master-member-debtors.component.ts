import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { LoginService } from '../../services/login.service';
import { MemberDebtorsService } from '../../services/member-debtors.service';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';

interface DataItem {
  Debtor: string;
  
}

@Component({
  selector: 'app-ticketing-master-member-debtors',
  templateUrl: './ticketing-master-member-debtors.component.html',
  styleUrl: './ticketing-master-member-debtors.component.css'
})
export class TicketingMasterMemberDebtorsComponent implements OnInit {
  displayedColumns: string[] = ['expand', 'Debtor', 'Balance', '%Utilized', 'PastDue%', 'DSO', 'Terms', 'CalcRateCode', 'RateDate','CredExpireMonth', 'CredExpireDate', 'extra'];
    isLoading = true;
    dataSource = new MatTableDataSource<any>([]);
    totalRecords = 0;
    filter: string = '';
    specificPage: number = 1;
    expandedElement: DataItem | null = null;
    math = Math;
    @Input() DebtorKey!: number;
    displayDebtor: any;

    DocumentsList: any;
    DocumentsCat: any;
    documentsFolder: any;
    profile: any;
    user: any;

    readonly dialog = inject(MatDialog);    

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;


  constructor(private route: ActivatedRoute, private masterDebtorService: DebtorsApiService,  private http: HttpClient,  private dataService: MemberDebtorsService, private router: Router,private loginService: LoginService){}
    
    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {        
        const DebtorKey = +params['DebtorKey'];        
        this.DebtorKey = DebtorKey
        this.displayDebtor = params['Debtor']                
        this.loadMemberDebtorDetails(DebtorKey);
      });
    }

    ngOnChanges(changes: SimpleChanges) {
      if (changes['DebtorKey']) {
        this.loadMemberDebtorDetails(this.DebtorKey);
      }
    }

    loadMemberDebtorDetails(DebtorKey: number): void {        
      this.dataService.getMemberDebtors(DebtorKey).subscribe(response => {        
        this.dataSource.data = response.data;
      });
    }

    applyFilter(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.filter = filterValue.trim().toLowerCase(); 
      this.paginator.pageIndex = 0; 
      this.loadMemberDebtorDetails(this.DebtorKey);
    }
    
    get totalPages(): number { 
      const pageSize = this.paginator?.pageSize || 25;
      return Math.ceil(this.totalRecords /  pageSize); 
    } 
        
    goToPage(): void { 
      if (this.specificPage < 1 || this.specificPage > this.totalPages) { 
        return;             
      } 
      if (this.paginator) {
        this.paginator.pageIndex = this.specificPage - 1;
        this.loadMemberDebtorDetails(this.DebtorKey);
      }
      
    }

    toggleRow(element: DataItem): void {                        
      this.expandedElement = this.expandedElement === element ? null : element;          
    }

    isExpanded(element: DataItem): boolean {
      return this.expandedElement === element;
    }

    isExpansionDetailRow = (index: number, row: DataItem) => row.hasOwnProperty('expandedDetail');

  getIcon(element: any): { icon: string, color: string } {
    if (this.math.round(element.DSO60) != 0 && this.math.round(element.DSO90) != 0) {        
      
      if (this.math.round(element.DSO60) == this.math.round(element.DSO90)) {
        return { icon: 'trending_up', color: 'red' };
      }
      if (this.math.round(element.DSO60) < this.math.round(element.DSO90)) {
        return { icon: 'trending_up', color: 'red' };
      }
      if ((this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 2)) ||  (this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 1))) {
        return { icon: 'trending_flat', color: 'orange' };
      }
      if (this.math.round(element.DSO60) > this.math.round(element.DSO90)) {
        return { icon: 'trending_down', color: 'green' };
      }
    }
    return { icon: '', color: 'grey' };
  }

  openDSODialog(DSO30: number, DSO60: number, DSO90:number, Debtor: string){
    const roundThousandsPipe = new RoundThousandsPipe();
    var DSO_30 = roundThousandsPipe.transform(DSO30);
    var DSO_60 = roundThousandsPipe.transform(DSO60);
    var DSO_90 = roundThousandsPipe.transform(DSO90);      

    const dialogRef = this.dialog.open(DocumentDialogComponent, {      
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                    
       data: {
        DSO_30: DSO_30,
        DSO_60: DSO_60,
        DSO_90: DSO_90,
        Debtor: Debtor
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        
    });
    
  }
  
}

