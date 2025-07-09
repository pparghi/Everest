import { AfterViewInit, Component, OnInit, ViewChild, inject, AfterViewChecked, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DebtorsApiService } from '../../services/debtors-api.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { error } from 'jquery';
import Swal from 'sweetalert2';
import { LoginService } from '../../services/login.service';
import { RoundThousandsPipe } from '../../round-thousands.pipe';
import { FilterService } from '../../services/filter.service';
import { DocumentsReportsService } from '../../services/documents-reports.service';
import { MatDrawer } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CacheService } from '../../services/cache.service';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

// #region Duns search cards
interface DunsInfo {
  companyName: string;
  dunsNumber: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  matchConfidence?: string;
}
@Component({
  selector: 'app-duns-card',
  template: `
    <mat-card class="duns-card">
      <mat-card-header>
        <div mat-card-avatar class="duns-header-image">
          <mat-icon>business</mat-icon>
        </div>
        <mat-card-title>{{ dunsInfo.companyName }}</mat-card-title>
        <mat-card-subtitle [style.color]="'rgb(3, 37, 131)'">DUNS: {{ dunsInfo.dunsNumber }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="card-text"><strong>Address:</strong> {{ dunsInfo.address }}</p>
        <p class="card-text"><strong>City/State:</strong> {{ dunsInfo.city }}, {{ dunsInfo.state }}</p>
        <p class="card-text" *ngIf="dunsInfo.phone"><strong>Phone:</strong> {{ dunsInfo.phone }}</p>
        <p class="card-text" *ngIf="dunsInfo.matchConfidence" class="match-confidence">
          <strong>Match confidence code:</strong> {{ dunsInfo.matchConfidence }} / 10
        </p>
      </mat-card-content>
      <mat-card-actions class="card-actions">
        <button mat-button color="primary" (click)="viewDetails()">VIEW DETAILS</button>
        <button mat-button color="accent" (click)="selectCompany()">SELECT</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .duns-card {
      margin: 5px;
      width: 350px;
      min-height: 330px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .duns-header-image {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
      border-radius: 50%;
      width: 40px;
      height: 40px;
    }
    
    .duns-header-image mat-icon {
      color: #3f51b5;
    }
    
    .match-confidence {
      margin-top: 10px;
      font-style: italic;
    }
    
    mat-card-content {
      margin-bottom: 55px;
    }

    .card-text {
      margin: 0.3rem 0;
      line-height: 1.3;
    }

    .card-actions {
      display: flex;
      justify-content: space-between;
      padding: 2px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: white;
      border-top: 1px solid #eeeeee;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule]
})
export class DunsCardComponent {
  @Input() dunsInfo!: DunsInfo;
  @Output() selectDunsCompany = new EventEmitter<{ dunsInfo: DunsInfo }>();

  viewDetails() {
    console.log('View details for:', this.dunsInfo.companyName);
  }

  selectCompany() {
    console.log('Selected company:', this.dunsInfo.companyName);
    // Emit the selected company info and the original debtor key
    this.selectDunsCompany.emit({ dunsInfo: this.dunsInfo });
  }
}

// endregion


// #region master-debtors.component
interface DataItem {
  Debtor: string;
  DebtorKey: number;
  DbDunsNo: string;
  Country: string;
  State: string;
  City: string;
  TotalCreditLimit: number;
  AIGLimit: string;
  Terms: string;
  NoBuyCode: number;
  PctUtilized: number;
  PastDuePct: number;
  Addr1: string;
  Addr2: string;
  Phone1: number;
  Phone2: number;
  Email: string;
  MotorCarrNo: number;
  CredExpireDate: string;
  RateDate: string;
  IndivCreditLimit: number;
  CredNote: string;
  Notes: string;
  Warning: string;
  CredExpireMos: number;
  DotNo: string;
  expandedDetail: { detail: string };
  ZipCode: string;
}

@Component({
  selector: 'app-master-debtors',
  templateUrl: './master-debtors.component.html',
  styleUrl: './master-debtors.component.css'
})

export class MasterDebtorsComponent implements OnInit, AfterViewInit, AfterViewChecked, OnChanges {
  displayedColumns: string[] = ['expand', 'Debtor', 'Balance', '%Utilized', 'PastDue%', 'DSO', 'TotalCreditLimit', 'IndivCreditLimit', 'AIGLimit', 'Terms', 'CalcRateCode', 'CredExpireDate', 'RateDate', 'Edit', 'extra'];
  isLoading = true;
  dataSource = new MatTableDataSource<any>();
  totalRecords = 0;
  filter: string = '';
  specificPage: number = 1;
  expandedElement: DataItem | null = null;
  math = Math;
  readonly dialog = inject(MatDialog);

  profile: any;
  user: any;
  DebtoNoBuyDisputeList: any;
  DocumentsList: any;
  DocumentsCat: any;
  documentsFolder: any;
  oldTotalCreditLimit: any;
  oldNoBuyCode: any;
  editedElement: DataItem | null = null;
  DebtorContactsData: any;

  filterByBalance: string = 'Balance'; // default filter by balance

  NavOptionMasterDebtor: any;
  NavAccessMasterDebtor: any;
  NavOptionClientRisk: any;
  NavAccessClientRisk: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  NavOptionMasterDebtorUpdate: any;
  NavAccessMasterDebtorUpdate: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;
  debtorAudit: any;

  isSortSubscribed = false; // flag of sort subscription, avoid multiple subscriptions
  @ViewChild('drawer') drawer!: MatDrawer;
  debtorName: string = '';
  debtorFullAddress: string = '';
  countryCode: string = '';

  dunsMatches: DunsInfo[] = []; // store DUNS search results and used for displaying duns search cards
  loadingDuns = false;

  // store selected debtor details
  selectedDebtorDetails: DataItem | null = null;

  @Input() userPermissions: any[] = []; // get user permissions from parent component
  permissionsReady = false;  // Flag to track if permissions are ready
  initialLoadComplete = false;  // Flag to avoid redundant loads

  constructor(private dataService: DebtorsApiService, private router: Router, private http: HttpClient, private loginService: LoginService, private filterService: FilterService, private documentsReportsService: DocumentsReportsService, private cacheService: CacheService) {
  }
  ngOnInit(): void {
    const filterValues = this.filterService.getFilterState("master-debtors"); // get filter state from filter service
    console.log('filterValues--', filterValues);
    if (filterValues) {
      this.filter = filterValues.filter || ''; // get filter value from filter state
      this.filterByBalance = filterValues.filterByBalance || 'Balance'; // get filter value from filter state
      console.log('filter--', this.filter, 'filterByBalance--', this.filterByBalance);
      
    }

    // if (this.userPermissions && Array.isArray(this.userPermissions) && this.userPermissions.length > 0) {
    //   this.processPermissions();
    //   this.permissionsReady = true;
    //   this.loadData();
    // }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const filterValues = this.filterService.getFilterState("master-debtors"); // get filter state from filter service
    console.log('filterValues--', filterValues);
    if (filterValues) {
      this.filter = filterValues.filter || ''; // get filter value from filter state
      this.filterByBalance = filterValues.filterByBalance || 'Balance'; // get filter value from filter state
      console.log('filter--', this.filter, 'filterByBalance--', this.filterByBalance);
      
    }
    if (changes['userPermissions'] && changes['userPermissions'].currentValue) {
      // Only process and load data if permissions have changed and are available
      if (Array.isArray(changes['userPermissions'].currentValue) &&
        changes['userPermissions'].currentValue.length > 0) {

        this.processPermissions();
        this.permissionsReady = true;

        // Only load data if this is the first time or if permissions actually changed
        if (!this.initialLoadComplete ||
          !changes['userPermissions'].firstChange) {
          this.loadData();
          this.initialLoadComplete = true;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // set html filter state
    if (this.filter) {
      document.getElementsByName('searchBar')[0].setAttribute('value', this.filter);
    }
    // set html filterByBalance states
    if (this.filterByBalance == 'Balance') {
      console.log('here in selecting Balance--');
      document.getElementsByName('filterByBalance')[1].setAttribute('checked', 'true');
    }
    else {
      console.log('here in selecting show all--');
      document.getElementsByName('filterByBalance')[0].setAttribute('checked', 'true');
    }
    if (this.paginator) {
      this.paginator.page.subscribe(() => {
        this.loadData();
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.sort && !this.isSortSubscribed) {
      this.isSortSubscribed = true; // set flag to true to avoid multiple subscriptions
      this.sort.sortChange.subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadData();
      });
    }
  }

  // method to process permissions
  private processPermissions(): void {
    // Reset all permission flags
    this.NavOptionMasterDebtor = '';
    this.NavAccessMasterDebtor = '';
    this.NavOptionClientRisk = '';
    this.NavAccessClientRisk = '';
    this.NavOptionUpdateMasterDebtor = '';
    this.NavAccessUpdateMasterDebtor = '';
    this.NavOptionRiskMonitoring = '';
    this.NavAccessRiskMonitoring = '';
    this.NavOptionRiskMonitoringRestricted = '';
    this.NavAccessRiskMonitoringRestricted = '';

    // Only process if permissions exist
    if (this.userPermissions && Array.isArray(this.userPermissions)) {
      this.userPermissions.forEach((element: any) => {
        if (element.NavOption === 'Master Debtor') {
          this.NavOptionMasterDebtor = element.NavOption;
          this.NavAccessMasterDebtor = element.NavAccess;
        } else if (element.NavOption === 'Client Risk Page') {
          this.NavOptionClientRisk = element.NavOption;
          this.NavAccessClientRisk = element.NavAccess;
        } else if (element.NavOption === 'Update Master Debtor') {
          this.NavOptionUpdateMasterDebtor = element.NavOption;
          this.NavAccessUpdateMasterDebtor = element.NavAccess;
        } else if (element.NavOption === 'Risk Monitoring') {
          this.NavOptionRiskMonitoring = element.NavOption;
          this.NavAccessRiskMonitoring = element.NavAccess;
        } else if (element.NavOption === 'Risk Monitoring Restricted') {
          this.NavOptionRiskMonitoringRestricted = element.NavOption;
          this.NavAccessRiskMonitoringRestricted = element.NavAccess;
        }
      });

      console.log('Permissions processed successfully');
    }
  }

  loadData(): void {
    // Only load data if permissions are ready
    if (!this.permissionsReady) {
      console.log('Waiting for permissions before loading data');
      return;
    }

    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      this.profile = profile;

      this.isLoading = true;
      let sort = this.sort?.active ? this.sort.active : 'Balance';
      let order = this.sort?.direction ? this.sort.direction : 'DESC';
      const page = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator ? this.paginator.pageSize : 25;

      const mail = btoa(this.profile.mail);

      let filterByBalance = '';

      if (this.filterByBalance == 'Balance') {
        filterByBalance = 'balance';
        if (!this.sort?.active) {
          sort = 'Balance';
          order = 'DESC';
        }
      }

      console.log('Loading data: sort--', sort, 'order--', order, 'page--', page, 'pageSize--', pageSize, 'filterByBalance--', filterByBalance, 'filter--', this.filter);

      this.dataService.getData(mail, page, pageSize, this.filter, sort, order, filterByBalance).subscribe(response => {
        this.isLoading = false;
        this.dataSource.data = response.data;
        const total = response.data[0].total;
        this.totalRecords = total;
        this.DebtoNoBuyDisputeList = response.noBuyDisputeList;
      });
    });
  }

  openMembersWindow(DebtorKey: number, Debtor: string): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/members'], { queryParams: { DebtorKey: DebtorKey, Debtor: Debtor } })
    );
    window.open(url, '_blank');
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterService.setFilterState('master-debtors', { "filter": filterValue.trim().toLowerCase() }); // save search value to filter service
    this.filter = filterValue.trim().toLowerCase();
    this.paginator.pageIndex = 0;
    console.log('sort--', this.sort);
    this.loadData();
  }

  get totalPages(): number {
    const pageSize = this.paginator?.pageSize || 25;
    return Math.ceil(this.totalRecords / pageSize);
  }

  goToPage(): void {
    if (this.specificPage < 1 || this.specificPage > this.totalPages) {
      return;
    }
    if (this.paginator) {
      this.paginator.pageIndex = this.specificPage - 1;
      this.loadData();
    }

  }

  toggleRow(element: DataItem): void {
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  isExpanded(element: DataItem): boolean {
    return this.expandedElement === element;
  }

  isEditModeOn(element: DataItem): boolean {
    return this.editedElement === element;
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
      if ((this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 2)) || (this.math.round(element.DSO60) == (this.math.round(element.DSO90) + 1))) {
        return { icon: 'trending_flat', color: 'orange' };
      }
      if (this.math.round(element.DSO60) > this.math.round(element.DSO90)) {
        return { icon: 'trending_down', color: 'green' };
      }
    }
    return { icon: '', color: 'grey' };
  }

  openDocumentsDialog(DebtorKey: number) {

    this.dataService.getDebtorsDocuments(DebtorKey).subscribe(response => {
      this.DocumentsList = response.documentsList;
      this.DocumentsCat = response.DocumentsCat;
      this.documentsFolder = response.DocumentsFolder;

      const dialogRef = this.dialog.open(DocumentDialogComponent, {
        width: 'auto',
        maxWidth: 'none',
        height: 'auto',
        panelClass: 'custom-dialog-container',
        data: {
          DebtorKey: DebtorKey,
          documentsList: this.DocumentsList,
          documentCategory: this.DocumentsCat,
          documentsFolder: this.documentsFolder,
          NavOptionUpdateMasterDebtor: this.NavOptionUpdateMasterDebtor,
          NavAccessUpdateMasterDebtor: this.NavAccessUpdateMasterDebtor

        }
      });

      dialogRef.afterClosed().subscribe(result => {

      });
    });
  }

  startEdit(row: DataItem, index: number) {
    this.oldTotalCreditLimit = row.TotalCreditLimit;
    this.oldNoBuyCode = row.NoBuyCode;
    this.editedElement = row;
  }

  edit(row: DataItem) {
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId

        // this.dataService.setEditData({ 
        //   DebtorKey: row.DebtorKey, 
        //   Debtor: row.Debtor, 
        //   Duns: row.DbDunsNo, 
        //   Addr1: row.Addr1, 
        //   Addr2: row.Addr2, 
        //   City: row.City, 
        //   State: row.State, 
        //   Phone1: row.Phone1, 
        //   Phone2: row.Phone2, 
        //   PctUtilized: row.PctUtilized, 
        //   PastDuePct: row.PastDuePct, 
        //   TotalCreditLimit: row.TotalCreditLimit, 
        //   AIGLimit: row.AIGLimit, 
        //   Terms: row.Terms, 
        //   openForm: 'editForm' 
        // });
        // this.router.navigate(['/edit-master-debtor']);
        const dialogRef = this.dialog.open(DocumentDialogComponent, {
          width: '1050px',
          maxWidth: 'none',
          height: 'auto',
          panelClass: 'custom-dialog-container',
          data: {
            DebtorKey: row.DebtorKey,
            Debtor: row.Debtor,
            Duns: row.DbDunsNo,
            Addr1: row.Addr1,
            Addr2: row.Addr2,
            City: row.City,
            State: row.State,
            Phone1: row.Phone1,
            Phone2: row.Phone2,
            PctUtilized: row.PctUtilized,
            PastDuePct: row.PastDuePct,
            TotalCreditLimit: row.TotalCreditLimit,
            IndivCreditLimit: row.IndivCreditLimit,
            AIGLimit: row.AIGLimit,
            Terms: row.Terms,
            MotorCarrNo: row.MotorCarrNo,
            Email: row.Email,
            RateDate: row.RateDate,
            CredExpireDate: row.CredExpireDate,
            openForm: 'editForm',
            CredAppBy: this.user,
            CredNote: row.CredNote,
            Notes: row.Notes,
            Warning: row.Warning,
            CredExpireMos: row.CredExpireMos,
            DotNo: row.DotNo
          }
        });
        dialogRef.afterClosed().subscribe(result => {

        });
      });
  }

  cancelEdit(row: DataItem) {
    row.NoBuyCode = this.oldNoBuyCode;
    this.editedElement = null;
  }

  saveRow(row: DataItem, index: number) {
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId

        if (this.oldTotalCreditLimit != row.TotalCreditLimit) {
          const DebtorKey = row.DebtorKey;
          const TotalCreditLimit = row.TotalCreditLimit;
          const CredAppBy = this.user;

          this.dataService.updateCreditLimit(DebtorKey, TotalCreditLimit, CredAppBy).subscribe(
            response => {
              Swal.fire('Thank you!', 'Credit Limit Updated succesfully!', 'success');
              this.loadData();
            },
            error => {
              Swal.fire('Oops!', 'Credit Limit Update Failed!', 'error');
              this.loadData();
            }
          )
        }

        if (this.oldNoBuyCode != row.NoBuyCode) {
          const DebtorKey = row.DebtorKey;
          const NoBuyDisputeKey = row.NoBuyCode;
          const CredAppBy = this.user;

          this.dataService.updateNobuyCode(DebtorKey, NoBuyDisputeKey, CredAppBy).subscribe(
            response => {
              Swal.fire('Thank you!', 'Account Status Updated succesfully!', 'success');
              this.loadData();
            },
            error => {
              Swal.fire('Oops!', 'Account Status Update Failed!', 'error');
              this.loadData();
            });
        }
      });
  }

  openDSODialog(DSO30: number, DSO60: number, DSO90: number, Debtor: string) {
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

  openDebtorContactsDialog(DebtorKey: number) {
    this.dataService.getDebtorsContacts(DebtorKey).subscribe(response => {
      this.DebtorContactsData = response.debtorContactsData;

      const dialogRef = this.dialog.open(DocumentDialogComponent, {
        width: 'auto',
        maxWidth: 'none',
        height: 'auto',
        panelClass: 'custom-dialog-container',
        data: {
          DebtorKey: DebtorKey,
          DebtorContactsData: this.DebtorContactsData,
        }
      });

      dialogRef.afterClosed().subscribe(result => {

      });
    });
  }

  openDebtorAuditDialog(DebtorKey: number) {
    const dialogRef = this.dialog.open(DocumentDialogComponent, {
      width: 'auto',
      maxWidth: 'none',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: {
        DebtorKey: DebtorKey,
        debtorAudit: 'debtorAudit',
      }
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openDebtorStatementsDialog(DebtorKey: number) {
    const dialogRef = this.dialog.open(DocumentDialogComponent, {
      width: 'auto',
      maxWidth: 'none',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: {
        DebtorKey: DebtorKey,
        debtorStatements: 'debtorStatements',
      }
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openChecqueSearchDialog(DebtorKey: number) {
    const dialogRef = this.dialog.open(DocumentDialogComponent, {
      width: 'auto',
      maxWidth: 'none',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: {
        DebtorKey: DebtorKey,
        openChequeSearchForm: 'chequeSearchForm',
      }
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  onChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.filterService.setFilterState('master-debtors', { "filterByBalance": selectElement.value }); // save search value to filter service
    this.filterByBalance = selectElement.value
    this.loadData();
  }

  // event of clicking report button 
  getReportLink(element: DataItem) {
    // console.log("element--",element);
    this.documentsReportsService.callAnsoniaAPI(element?.MotorCarrNo.toString() ?? '', element.Debtor ?? '', element.Addr1 ?? '', element.City ?? '', element.State ?? '', element.Country ?? '').subscribe((response: { url: string }) => {
      // console.log('response--', response);
      window.open(response.url, "_blank");
    });
  }

  // event of searching Duns number
  searchDuns(element: DataItem) {
    // set the selected debtor details
    this.selectedDebtorDetails = element;

    if (this.drawer) {
      this.drawer.toggle();
    }

    // console.log("element--", element);
    let fullAddress = "";
    if (element.Addr1) {
      fullAddress += element.Addr1 + ", ";
    }
    if (element.Addr2) {
      fullAddress += element.Addr2 + ", ";
    }
    if (element.City) {
      fullAddress += element.City + ", ";
    }
    if (element.State) {
      fullAddress += element.State + ", ";
    }
    if (element.Country) {
      fullAddress += element.Country + ", ";
    }
    if (element.ZipCode) {
      fullAddress += element.ZipCode;
    }
    fullAddress = fullAddress.trim().replace(/^,+\s*|\s*,+$/g, "");
    this.debtorName = element.Debtor;
    this.debtorFullAddress = fullAddress;
    this.countryCode = this.convertCountryToCode(element.Country);
    // console.log("Name--", element.Debtor);
    // console.log("fullAddress--", fullAddress);

    this.loadingDuns = true;

    this.dataService.searchDuns(this.debtorName, element.Addr1, element.Addr2, element.City, element.State, element.ZipCode, this.countryCode).subscribe((response: any) => {
      console.log('searchDuns response--', response);
      this.loadingDuns = false;
      this.dunsMatches = response.results.matchCandidates.map((match: any) => ({
        companyName: match.organization.primaryName || 'N/A',
        dunsNumber: match.organization.duns || 'N/A',
        address: this.combineAddress(match.organization.primaryAddress.streetAddress.line1, match.organization.primaryAddress.streetAddress.line2) || 'N/A',
        city: match.organization.primaryAddress.addressLocality.name || 'N/A',
        state: match.organization.primaryAddress.addressRegion.abbreviatedName || 'N/A',
        phone: match.organization.telephone.telephoneNumber || 'N/A',
        matchConfidence: match.matchQualityInformation.confidenceCode || 'N/A'
      }));
    });
  }

  // conbine address line1 and line2
  private combineAddress(address1: string, address2: string): string {
    let combinedAddress = address1 || '';
    if (address2) {
      combinedAddress += ', ' + address2;
    }
    return combinedAddress.trim();
  }

  // convert country name to code, US and CA only
  private convertCountryToCode(country: string): string {
    if (country.toLowerCase() === 'united states' || country.toLowerCase() === 'us') {
      return 'US';
    } else if (country.toLowerCase() === 'canada' || country.toLowerCase() === 'ca') {
      return 'CA';
    }
    return '';
  }

  // Add this method to your MasterDebtorsComponent class
  searchDunsByNameOnly(): void {
    if (!this.debtorName) {
      return;
    }

    this.loadingDuns = true;

    // Use only the company name for search, without address
    this.dataService.searchDuns(this.debtorName, '', '', '', '', '', this.countryCode).subscribe({
      next: (response: any) => {
        console.log('searchDunsByNameOnly response--', response);
        this.loadingDuns = false;
        this.dunsMatches = response.results.matchCandidates.map((match: any) => ({
          companyName: match.organization.primaryName || 'N/A',
          dunsNumber: match.organization.duns || 'N/A',
          address: this.combineAddress(match.organization.primaryAddress.streetAddress.line1, match.organization.primaryAddress.streetAddress.line2) || 'N/A',
          city: match.organization.primaryAddress.addressLocality.name || 'N/A',
          state: match.organization.primaryAddress.addressRegion.abbreviatedName || 'N/A',
          phone: match.organization.telephone.telephoneNumber || 'N/A',
          matchConfidence: match.matchQualityInformation.confidenceCode || 'N/A'
        }));
      },
      error: (err) => {
        console.error('Error searching by name only:', err);
        this.loadingDuns = false;
        this.dunsMatches = [];
      }
    });
  }

  // Add this method to handle the DUNS selection and update
  updateDebtorWithDunsInfo(event: DunsInfo): void {
    console.log('Selected DUNS info:', event);
    console.log('Selected debtor details:', this.selectedDebtorDetails);
    // User confirmed, proceed with update
    const formData = new FormData();
    if (this.selectedDebtorDetails) {
      formData.append('DebtorKey', this.selectedDebtorDetails.DebtorKey.toString());
      formData.append('Debtor', this.selectedDebtorDetails.Debtor);
      formData.append('Duns', event.dunsNumber);
      formData.append('Addr1', this.selectedDebtorDetails.Addr1);
      formData.append('Addr2', this.selectedDebtorDetails.Addr2);
      formData.append('Phone1', this.selectedDebtorDetails.Phone1.toString());
      formData.append('Phone2', this.selectedDebtorDetails.Phone2.toString());
      formData.append('City', this.selectedDebtorDetails.City);
      formData.append('State', this.selectedDebtorDetails.State);
      formData.append('TotalCreditLimit', this.selectedDebtorDetails.TotalCreditLimit.toString());
      formData.append('IndivCreditLimit', this.selectedDebtorDetails.IndivCreditLimit.toString());
      formData.append('AIGLimit', this.selectedDebtorDetails.AIGLimit);
      formData.append('Terms', this.selectedDebtorDetails.Terms);
      formData.append('MotorCarrNo', this.selectedDebtorDetails.MotorCarrNo.toString());
      formData.append('Email', this.selectedDebtorDetails.Email);
      formData.append('RateDate', this.selectedDebtorDetails.RateDate);
      formData.append('CredExpireMos', this.selectedDebtorDetails.CredExpireMos.toString());
      formData.append('Notes', this.selectedDebtorDetails.Notes);
      formData.append('CredNote', this.selectedDebtorDetails.CredNote);
      formData.append('Warning', this.selectedDebtorDetails.Warning);
      formData.append('DotNo', this.selectedDebtorDetails.DotNo);
    }

    // Get the logged in user for CredAppBy
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      const userId = (profile as any).mail.match(/^([^@]*)@/)[1];
      formData.append('CredAppBy', userId.toUpperCase());

      // console.log('Form data to update debtor:');
      // // Iterate through FormData to see its contents (TypeScript-safe)
      // formData.forEach((value, key) => {
      //   console.log(key + ': ' + value);
      // });

      // Call the API service to update the debtor
      this.dataService.updateDebtorDetails(formData).subscribe({
        next: (response) => {
          // Clear master debtors data cache for showing updated Duns
          this.cacheService.removeByPattern('/api/debtors?');

          // Show success message
          Swal.fire('Success', 'Debtor information updated successfully with DUNS data.', 'success');
          this.drawer.close(); // Close the drawer
          this.loadData(); // Refresh the data
        },
        error: (error) => {
          console.error('Error updating debtor details:', error);
          Swal.fire('Error', 'Failed to update debtor information.', 'error');
        }
      });
    });
  }


}