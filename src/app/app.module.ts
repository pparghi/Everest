import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MsalGuard, MsalInterceptor, MsalModule, MsalRedirectComponent } from '@azure/msal-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { MainContentComponent } from './components/main-content/main-content.component';
// import { DataTableComponent } from './components/data-table/data-table.component';
import { NgxDatatableModule} from '@swimlane/ngx-datatable';
// import { DataTablesModule } from 'angular-datatables';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MembersComponent } from './components/members/members.component';
import { TableOverviewExampleComponent } from './components/table-overview-example/table-overview-example.component';
import { MatFormField, MatFormFieldModule, MatFormFieldControl } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortHeader, MatSortModule } from '@angular/material/sort';
import { ThousandsPipe } from './thousands.pipe';
import { MasterDebtorsComponent, DunsCardComponent } from './components/master-debtors/master-debtors.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ClientsComponent } from './components/clients/clients.component';
import { ClientsInvoicesComponent } from './components/clients-invoices/clients-invoices.component';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { InvoicesComponent } from './components/invoices/invoices.component';
import { MasterClientsComponent } from './components/master-clients/master-clients.component';
import { RoundThousandsPipe } from './round-thousands.pipe';
import { MemberClientsComponent } from './components/member-clients/member-clients.component';
import { DocumentDialogComponent } from './components/document-dialog/document-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { ClientsDebtorsComponent } from './components/clients-debtors/clients-debtors.component';
import { CacheService } from './services/cache.service';
import { CacheInterceptor } from './http-interceptors/http-interceptors';
import { UserIdInterceptor } from './http-interceptors/UserIdInterceptor';
import { TestComponent } from './components/test/test.component';
import { MemberMasterDebtorComponent } from './components/member-master-debtor/member-master-debtor.component';
import { MasterDebtorEditComponent } from './components/master-debtor-edit/master-debtor-edit.component';
import { RiskMonitoringComponent } from './components/risk-monitoring/risk-monitoring.component';
const isIE = window.navigator.userAgent.indexOf('MSIE')>-1  || window.navigator.userAgent.indexOf('Trident/');
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RiskMonitoringDetailComponent } from './components/risk-monitoring-detail/risk-monitoring-detail.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TicketingComponent } from './components/ticketing/ticketing.component';
import { TicketingMasterMemberDebtorsComponent } from './components/ticketing-master-member-debtors/ticketing-master-member-debtors.component';
import { MatTableExporterModule } from 'mat-table-exporter';
import { NegativeToParenthesesPipe } from './negative-to-parentheses.pipe';
import { MatExpansionModule } from '@angular/material/expansion';
import { MinutesToDHMPipe } from './minutes-to-dhm.pipe';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import { NoticeOfAccessmentComponent } from './components/notice-of-accessment/notice-of-accessment.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatRadioModule} from '@angular/material/radio';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { DocumentsStatementsComponent } from './components/documents-statements/documents-statements.component';
import { ReleaseLetterComponent } from './components/release-letter/release-letter.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import { TicketingAnalysisComponent } from './components/ticketing-analysis-dialog/ticketing-analysis-dialog.component';
import {MatGridListModule} from '@angular/material/grid-list';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    NavigationComponent,
    MainContentComponent,
    // DataTableComponent,
    MembersComponent,
    TableOverviewExampleComponent,
    ThousandsPipe,
    MasterDebtorsComponent,
    ClientsComponent,
    ClientsInvoicesComponent,
    InvoicesComponent,
    MasterClientsComponent,
    RoundThousandsPipe,
    MemberClientsComponent,
    DocumentDialogComponent,
    ClientsDebtorsComponent,
    TestComponent,
    MemberMasterDebtorComponent,
    MasterDebtorEditComponent,
    RiskMonitoringComponent,
    RiskMonitoringDetailComponent,
    TicketingComponent,
    TicketingMasterMemberDebtorsComponent,
    NegativeToParenthesesPipe,
    MinutesToDHMPipe,
    NoticeOfAccessmentComponent,
    DocumentsStatementsComponent,
    ReleaseLetterComponent,
    TicketingAnalysisComponent,    
  ],
  imports: [
    MatDatepickerModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatTableExporterModule,
    MsalModule.forRoot(new PublicClientApplication({
        auth: {
            clientId: '6abad1c1-70c7-4eaf-a4ee-3c4827ed050f',
            redirectUri: 'https://everest.revinc.com',
            authority: 'https://login.microsoftonline.com/1dfa1c9f-1ea3-4b25-a811-115259596ebb'
        },
        cache: {
        // cacheLocation:'localStorage',
        // storeAuthStateInCookie: isIE
        }
    }), {
        interactionType: InteractionType.Redirect,
        authRequest: {
            scopes: ['user.read']
        }
    }, {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
            ['https://graph.microsoft.com/v1.0/me', ['user.read']]
        ])
    }),
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxDatatableModule,
    // DataTablesModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormField,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatPaginator,
    MatSortModule,
    MatSort,
    MatSortHeader,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatProgressBarModule,
    MatSidenavModule,
    DunsCardComponent,
    MatGridListModule
],
  providers: [
    CacheService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    },
   MsalGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    }, 
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UserIdInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
