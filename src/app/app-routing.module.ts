import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainContentComponent } from './components/main-content/main-content.component';
import { MembersComponent } from './components/members/members.component';
import { TableOverviewExampleComponent } from './components/table-overview-example/table-overview-example.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ClientsInvoicesComponent } from './components/clients-invoices/clients-invoices.component';
import { MsalGuard } from '@azure/msal-angular';
import { InvoicesComponent } from './components/invoices/invoices.component';
import { MasterClientsComponent } from './components/master-clients/master-clients.component';
import { MemberClientsComponent } from './components/member-clients/member-clients.component';
import { ClientsDebtorsComponent } from './components/clients-debtors/clients-debtors.component';
import { TestComponent } from './components/test/test.component';
import { MemberMasterDebtorComponent } from './components/member-master-debtor/member-master-debtor.component';
import { MasterDebtorEditComponent } from './components/master-debtor-edit/master-debtor-edit.component';
import { RiskMonitoringComponent } from './components/risk-monitoring/risk-monitoring.component';
import { RiskMonitoringDetailComponent } from './components/risk-monitoring-detail/risk-monitoring-detail.component';
import { TicketingComponent } from './components/ticketing/ticketing.component';
import { TicketingMasterMemberDebtorsComponent } from './components/ticketing-master-member-debtors/ticketing-master-member-debtors.component';
import { NoticeOfAccessmentComponent } from './components/notice-of-accessment/notice-of-accessment.component';
import { DocumentsStatementsComponent } from './components/documents-statements/documents-statements.component';
import { ReleaseLetterComponent } from './components/release-letter/release-letter.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientDocumentsComponent } from './components/client-documents/client-documents.component';

const routes: Routes = [  
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Add default route
  { path: 'dashboard', component: DashboardComponent, canActivate:[MsalGuard] },
  { path: 'master-debtors', component: MainContentComponent, canActivate:[MsalGuard] },  
  { path: 'edit-master-debtor', component: MasterDebtorEditComponent },  
  { path: 'members', component: MembersComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'invoices', component: ClientsInvoicesComponent },
  { path: 'risk-client', component: MasterClientsComponent },
  { path: 'member-client', component: MemberClientsComponent },
  { path: 'client-debtor', component: ClientsDebtorsComponent },
  { path: 'memberMasterdebtor', component: MemberMasterDebtorComponent },
  { path: 'invoice-search', component: InvoicesComponent },
  { path: 'notice-of-accessment', component: NoticeOfAccessmentComponent },
  { path: 'documents-statements', component: DocumentsStatementsComponent },
  { path: 'release-letter', component: ReleaseLetterComponent },
  { path: 'detail', component: RiskMonitoringDetailComponent },
  { path: 'monitoring', component: RiskMonitoringComponent },
  { path: 'ticketing', component: TicketingComponent },
  { path: 'debtorsTicketing', component: TicketingMasterMemberDebtorsComponent },
  { path: 'client-documents', component: ClientDocumentsComponent },
  { path: 'test', component: TestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
