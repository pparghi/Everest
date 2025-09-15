import { Component, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css'
})
export class MainContentComponent {
  currentPath: string = '';
  // Add input property to receive permissions
  @Input() userPermissionsDisctionary: any = {};

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentPath = this.router.url.split('/').slice(1).join('/');
    });
  }
  ngOnInit(): void {
    // Initial load
    this.currentPath = this.router.url.split('/').slice(1).join('/');
  }

  showChildComponent(currentURL: string): boolean {

    if (this.currentPath.includes(currentURL)) {
      switch(currentURL) {
        case 'dashboard':
          return this.userPermissionsDisctionary['Everest Dashboard']['View Full'] + this.userPermissionsDisctionary['Everest Dashboard']['Full'] >= 1;
        case 'master-debtors':
          return this.userPermissionsDisctionary['Everest Master Debtors']['View Restricted'] + this.userPermissionsDisctionary['Everest Master Debtors']['View Full'] + this.userPermissionsDisctionary['Everest Master Debtors']['Full'] >= 1;
        case 'risk-client':
          return this.userPermissionsDisctionary['Everest Client Risk']['View Restricted'] + this.userPermissionsDisctionary['Everest Client Risk']['View Full'] + this.userPermissionsDisctionary['Everest Client Risk']['Full'] >= 1;
        case 'monitoring':
          return this.userPermissionsDisctionary['Everest Risk Monitoring']['View Restricted'] + this.userPermissionsDisctionary['Everest Risk Monitoring']['View Full'] + this.userPermissionsDisctionary['Everest Risk Monitoring']['Edit Restricted'] + this.userPermissionsDisctionary['Everest Risk Monitoring']['Full'] >= 1;
        case 'ticketing':
          return this.userPermissionsDisctionary['Everest Credit Requests']['View Restricted'] + this.userPermissionsDisctionary['Everest Credit Requests']['View Full'] + this.userPermissionsDisctionary['Everest Credit Requests']['Full'] >= 1;
        case 'invoice-search':
          return this.userPermissionsDisctionary['Everest Invoices']['View Restricted'] + this.userPermissionsDisctionary['Everest Invoices']['View Full'] >= 1;
        case 'notice-of-accessment':
          return this.userPermissionsDisctionary['Everest Documents NOA']['PDF'] + this.userPermissionsDisctionary['Everest Documents NOA']['Full'] >= 1;
        case 'release-letter':
          return this.userPermissionsDisctionary['Everest Documents Release']['PDF'] + this.userPermissionsDisctionary['Everest Documents Release']['Full'] >= 1;
        case 'documents-statements':
          return this.userPermissionsDisctionary['Everest Documents Statements']['View Full'] + this.userPermissionsDisctionary['Everest Documents Statements']['Full'] >= 1;
        case 'client-documents':
          return this.userPermissionsDisctionary['Everest Documents Client Documents']['View Restricted'] + this.userPermissionsDisctionary['Everest Documents Client Documents']['View Full'] + this.userPermissionsDisctionary['Everest Documents Client Documents']['Full'] >= 1;
        default:
          return false;
      }
    }

    return false;

  }
}
