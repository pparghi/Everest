import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../services/login.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { DataService } from '../../services/data.service';
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
  ClientKey: any;
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
  user: any;
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
  bgcolor = '2px solid green';
  LevelHistory: any;
  note_category: any = '';
  due_date: any = '';
  note: any = '';

  readonly dialog = inject(MatDialog);
  data!: string[];
  LevelValue: any;
  hiddenNoteText = 'Hidden Notes';
  hideNoteBtnText = 'Hide Note';
  
  @ViewChild('spanElement') spanElement!: ElementRef;
  @ViewChild('spanHideElement') spanHideElement!: ElementRef;
  hiddenNotesSpanText = '';
  hideNoteSpanText = '';
  
  constructor(private route: ActivatedRoute, private dataService: RiskMonitoringService, private http: HttpClient, private loginService: LoginService, private riskService: DataService, private router: Router) { 
    
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
      const Level = params['Level'];      
      
      this.ARGrossBalance = ARGrossBalance;
      this.Ineligible = Ineligible;
      this.NFE = NFE;
      this.Reserve = Reserve;
      this.Availability = Availability;
      // this.Level = Level;

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
      this.loadClientGroupLevelList();
      this.checkLevel();      

      if (this.checkLevel()) {        
        this.bgcolor = '2px solid red';
      }
    });       

    const LevelValue = this.riskService.getData();
    console.log('test----',LevelValue['Level']);
    

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

  ngAfterViewInit() {
    // After the view is initialized, you can get the text content of the span
    const hiddenNotesSpanText = this.spanElement.nativeElement.innerText;
    this.hiddenNotesSpanText = hiddenNotesSpanText;
    const hideNoteSpanText = this.spanHideElement.nativeElement.innerText;
    this.hideNoteSpanText = hideNoteSpanText;    
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
      this.LevelHistory = data.LevelHistory;      
      this.Level = data.ClientLevelDetail[0].GroupValue;                      
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
    this.dataService.getMonitoringNotes(ClientKey, this.category, 'N').subscribe(data => {
      this.MonitoringNotes = data.MonitoringNotes;     
    });       
  }

  onCategoryChange(event: Event){
    const selectElement = event.target as HTMLSelectElement;
      this.category = selectElement.value               
      this.loadMonitoringNotes(this.ClientKey);      
  }

  addNote(){
    this.http.get(GRAPH_ENDPOINT)
    .subscribe(profile => {
      this.profile = profile;          
      var userId = this.profile.mail.match(/^([^@]*)@/)[1];
      this.user = userId 
    });

    this.dataService.addNotesRisk(this.ClientKey, this.note_category, this.note, '', '1', this.user, this.due_date).subscribe(response => {      
      window.location.reload();
    }, error => {
      alert('Failed');
    });
  }

  onChangeCRM(event: Event, ClientKey: string){
    const confirmed = window.confirm('Are you sure you want to update the CRM?');
    if (confirmed) {
      this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId 
      });
      const selectElement = event.target as HTMLSelectElement;          
      let crm = selectElement.value;
      let UserKey = this.user;

      this.dataService.updateCRMRisk(ClientKey, crm, UserKey).subscribe(
        response => {           
          window.location.reload();
        },
        error => {
          alert("error");
        }              
      )
    } else {      
      window.location.reload();
      console.log('Update cancelled');
    }
  };

  onChangeLevel(event: Event, ClientKey: string){
    const confirmed = window.confirm('Are you sure you want to update the Level?');
    if (confirmed) {
      this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId 
      });
      const selectElement = event.target as HTMLSelectElement;          
      let GroupValue = selectElement.value;
      let UserKey = this.user;
  
      this.dataService.updateLevelRisk(ClientKey, GroupValue, UserKey).subscribe(
        response => {           
          window.location.reload();
        },
        error => {
          alert("error");
        }              
      )
    } else {      
      window.location.reload();
      console.log('Update cancelled');
    }    
  };

  onChangeCompleteStatus(event: Event){
    const confirmed = window.confirm('Are you sure you want to update the Complete Status?');
    if (confirmed) {
      const target = event.target as HTMLElement;
      const id = target.id;
      this.data = id.split('-');
      let complete = "Y";

      this.dataService.updateCompleteStatusRisk(this.data[1], complete).subscribe(
        response => {           
          window.location.reload();
        },
        error => {
          alert("error");
        }              
      )
    } else {      
      window.location.reload();
      console.log('Update cancelled');
    }
  }

  onChangeNotCompleteStatus(event: Event){
    const confirmed = window.confirm('Are you sure you want to update the Complete Status?');
    if (confirmed) {
      const target = event.target as HTMLElement;
      const id = target.id;
      this.data = id.split('-');
      let complete = "N";

      this.dataService.updateCompleteStatusRisk(this.data[1], complete).subscribe(
        response => {           
          window.location.reload();
        },
        error => {
          alert("error");
        }              
      )
    } else {      
      window.location.reload();
      console.log('Update cancelled');
    }
  }

  levelHistory(){
    const dialogRef = this.dialog.open(DocumentDialogComponent, {      
      width: 'auto',       
      maxWidth: 'none',   
      height: 'auto',    
      panelClass: 'custom-dialog-container',                    
        data: {              
          LevelHistory: this.LevelHistory            
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        
    });
  }

  goBack(){
    this.router.navigate(['/monitoring']);
  }

  hiddenNotes(ClientKey: number){           
    if (this.hiddenNoteText == 'Hidden Notes') {      
      this.hiddenNoteText = 'Visible Notes';
      this.hideNoteBtnText = 'Unhide Note';
      this.dataService.getMonitoringNotes(ClientKey, this.category, 'Y').subscribe(data => {
        this.MonitoringNotes = data.MonitoringNotes;     
      });
    } else {      
      this.hiddenNoteText = 'Hidden Notes';
      this.hideNoteBtnText = 'Hide Note';
      this.dataService.getMonitoringNotes(ClientKey, this.category, 'N').subscribe(data => {
        this.MonitoringNotes = data.MonitoringNotes;     
      });
    }         
  }

  hideNote(ClientNoteKey: string){
    this.http.get(GRAPH_ENDPOINT)
    .subscribe(profile => {
      this.profile = profile;          
      var userId = this.profile.mail.match(/^([^@]*)@/)[1];
      this.user = userId 
    });
    if (this.hideNoteBtnText == 'Hide Note') { 
      this.dataService.clientNotesHide(ClientNoteKey, this.user, 'Y').subscribe(
        response => { 
          console.log('Note Hidden Successfully.');
          window.location.reload();
        },
        error => {
          console.log('error', error);
        }              
        )
      } else {
      this.dataService.clientNotesHide(ClientNoteKey, this.user, 'N').subscribe(
        response => { 
          console.log('Note Hidden Successfully.');
          window.location.reload();
        },
        error => {
          console.log('error', error);
        }              
      )
    }
  }
}
