import { Component } from '@angular/core';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../services/login.service';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

@Component({
  selector: 'app-risk-monitoring-detail',
  templateUrl: './risk-monitoring-detail.component.html',
  styleUrl: './risk-monitoring-detail.component.css'
})
export class RiskMonitoringDetailComponent {  
  client: any;
  contacts: any;
  MonitoringCategories: any;
  MonitoringNotes: any;
  category = '';
  ClientKey!: number;
  ARGrossBalance!: number;
  ARGrossBalanceNeg!: number;
  Ineligible!: number;
  NFE!: number;
  Reserve!: number;
  Availability!: number;
  IneligibleNeg!: number;
  NFENeg!: number;
  ReserveNeg!: number;
  AvailabilityNeg!: number;
  ClientFuelOrNot: any;
  isFuel = '';
  profile: any; 
  NavOptionMasterDebtor: any;
  NavAccessMasterDebtor: any;
  NavOptionClientRisk: any;
  NavAccessClientRisk: any;
  NavOptionUpdateMasterDebtor: any;
  NavAccessUpdateMasterDebtor: any;
  NavOptionRiskMonitoring: any;
  NavAccessRiskMonitoring: any;
  NavOptionRiskMonitoringRestricted: any;
  NavAccessRiskMonitoringRestricted: any;
  clientCRMList: any;
  clientGroupLevelList: any;
  Level!: any;
  bgcolor = 'green;';
  
  constructor(private route: ActivatedRoute, private dataService: RiskMonitoringService, private http: HttpClient, private loginService: LoginService) { 
    
  }

  ngOnInit(): void {    
    this.route.queryParams.subscribe(params => {
      const ClientKey = +params['ClientKey'];
      this.ClientKey = ClientKey;
      const ARGrossBalance = +params['ARGrossBalance'];
      const Ineligible = +params['Ineligible'];
      const NFE = +params['NFE'];
      const Reserve = +params['Reserve'];
      const Availability = +params['Availability'];
      const Level = +params['Level'];
      
      this.ARGrossBalance = ARGrossBalance;
      this.Ineligible = Ineligible;
      this.NFE = NFE;
      this.Reserve = Reserve;
      this.Availability = Availability;
      this.Level = Level;

      this.ARGrossBalanceNeg = ARGrossBalance*-1;        
      this.IneligibleNeg = Ineligible*-1;    
      this.NFENeg = NFE*-1;     
      this.ReserveNeg = Reserve*-1;     
      this.AvailabilityNeg = Availability*-1;                
      
      this.loadClientDetails(ClientKey); 
      this.loadClientContactsDetails(ClientKey);
      this.loadMonitoringCategories();
      this.loadMonitoringNotes(ClientKey);
      this.loadClientCRMList();
      this.checkLevel();

      if (this.checkLevel()) {
        this.bgcolor = 'red;';
      }
    });       
    this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
      this.profile = profile;
      this.loginService.getData(this.profile.mail).subscribe(response => {                                
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
  }  

  checkLevel(): boolean {
    return this.startsWith(this.Level, 'SPECIAL');
  }

  startsWith(value: string, searchString: string): boolean {
    return value.startsWith(searchString);
  }

  loadClientCRMList() {
    this.dataService.getCRMList().subscribe(response => {                                         
      this.clientCRMList = response.CRMList;
    });
  }

  loadClientGroupLevelList() {
    this.dataService.getClientGroupLevelList().subscribe(response => {                                         
      this.clientGroupLevelList = response.clientGroupLevelList;
    });
  }

  loadClientDetails(ClientKey: number){
    this.dataService.getClientDetails(ClientKey).subscribe(data => {
      this.client = data.ClientDetails[0];      
    });
  }

  loadClientContactsDetails(ClientKey: number){
    this.dataService.getClientContactsDetails(ClientKey).subscribe(data => {
      this.contacts = data.ClientContactsDetails;    
      this.ClientFuelOrNot = data.ClientFuelOrNot;  
      if (this.ClientFuelOrNot[0]) {
        this.isFuel = 'YES';
      }      
    });
  }

  loadMonitoringCategories(){
    this.dataService.getMonitoringCategories().subscribe(data => {
      this.MonitoringCategories = data.MonitoringCategories;      
    });       
  }

  loadMonitoringNotes(ClientKey: number){
    this.dataService.getMonitoringNotes(ClientKey, this.category).subscribe(data => {
      this.MonitoringNotes = data.MonitoringNotes;     
    });       
  }

  onCategoryChange(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.category = selectElement.value               
      this.loadMonitoringNotes(this.ClientKey);      
  }

  addNote(){
    
  }
}
