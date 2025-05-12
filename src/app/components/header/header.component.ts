import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { MSAL_GUARD_CONFIG, MsalBroadcastConfiguration, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { Subject, filter, takeUntil } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  profile: any;
  isUserLoggedIn:boolean = false;
  private readonly _destroy = new Subject<void>();
  
  NavOptionMasterDebtor: any;
  NavAccessMasterDebtor: any;
  NavOptionClientRisk: any;
  NavAccessClientRisk: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  todayDate: any;
  todayRate: any;
  todayCurrency: any;

  readonly dialog = inject(MatDialog);    
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;

  constructor(@Inject(MSAL_GUARD_CONFIG) 
  private msalGuardConfig: MsalGuardConfiguration, 
  private msalBroadcast: MsalBroadcastService,
  private authService: MsalService,
  private http: HttpClient,
  private dataService: LoginService,
  private router: Router
  ) {}

  // #region documents tab
  // for documents tab is selected
  isDocumentsTabActive: boolean = false;
  // #endregion

  ngOnInit(): void {
    // Listen to route changes to determine if the "Documents" tab should be active
    this.router.events.subscribe(() => {
      this.isDocumentsTabActive = this.router.url.includes('/notice-of-accessment');
    });

    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      
      this.profile = profile;     
      this.dataService.getData(this.profile.mail).subscribe(response => {                                
        response.data.forEach((element: any) => {
          if (element.NavOption == 'Master Debtor') {            
            this.NavOptionMasterDebtor = element.NavOption;          
            this.NavAccessMasterDebtor = element.NavAccess;
          } else if (element.NavOption == 'Client Risk Page'){
            this.NavOptionClientRisk = element.NavOption;          
            this.NavAccessClientRisk = element.NavAccess;
          } else if (element.NavOption == 'Update Master Debtor'){
            this.NavOptionUpdateMasterDebtor = element.NavOption;          
            this.NavAccessUpdateMasterDebtor = element.NavAccess;
          } else if (element.NavOption == 'Risk Monitoring'){
            this.NavOptionRiskMonitoring = element.NavOption;          
            this.NavAccessRiskMonitoring = element.NavAccess;
          } else if (element.NavOption == 'Risk Monitoring Restricted'){
            this.NavOptionRiskMonitoringRestricted = element.NavOption;          
            this.NavAccessRiskMonitoringRestricted = element.NavAccess;
          } else {
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
          }          
        });
      }, error => {
        console.error('error--', error);
      });    

      
    });
    this.dataService.getExchangeRatesByMonth().subscribe(response => {                                     
      this.todayDate = response.data[0].YearMonth;                
      this.todayRate = response.data[0].Rate;          
      this.todayCurrency = response.data[0].Currency;          
      response.data.forEach((element: any) => {

      });
    }, error => {
      console.error('error--', error);
    });    
    
    this.msalBroadcast.inProgress$.pipe(filter((interactionstatus: InteractionStatus) => interactionstatus == InteractionStatus.None),
    takeUntil(this._destroy))
    .subscribe(x => {
      this.isUserLoggedIn = this.authService.instance.getAllAccounts().length > 0
    })
  }

  ngOnDestroy(): void {
    this._destroy.next(undefined);
    this._destroy.complete()
  }

  login(){
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest)
    }else{
      this.authService.loginRedirect();
    }
  }

  logout(){
    this.authService.logoutRedirect()
  }

  moreInfo(){
    this.dataService.getExchangeRatesByMonth().subscribe(response => {       
      const dialogRef = this.dialog.open(DocumentDialogComponent, {                
        data: {
          exchangeRatesByMonth: response.exchangeRatesByMonth
        }
      });        
      dialogRef.afterClosed().subscribe(result => {            
      });                                              
      
    }, error => {
      console.error('error--', error);
    });
  }

}
