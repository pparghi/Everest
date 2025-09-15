import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RiskMonitoringService } from '../../services/risk-monitoring.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoginService } from '../../services/login.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentDialogComponent } from '../document-dialog/document-dialog.component';
import { DataService } from '../../services/data.service';
import Swal from 'sweetalert2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WarningSnackbarComponent, SuccessSnackbarComponent, ErrorSnackbarComponent } from '../custom-snackbars/custom-snackbars';
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
  CRM!: any;
  bgcolor = '2px solid green';
  LevelHistory: any;
  note_category: any = '';
  due_date: any = '';
  note: any = '';

  readonly dialog = inject(MatDialog);
  data!: string[];  
  hiddenNoteText = 'Hidden Notes';
  hideNoteBtnText = 'Hide Note';
  
  @ViewChild('spanElement') spanElement!: ElementRef;
  @ViewChild('spanHideElement') spanHideElement!: ElementRef;
  hiddenNotesSpanText = '';
  hideNoteSpanText = '';

  clientSummary: string = '';

  // Inject the MatSnackBar service
  private _snackBar = inject(MatSnackBar);

  userAccessLevel: string = 'No Access'; // Add userAccessLevel property

  // Helper method to check if user can edit
  canEdit(edit = 'other'): boolean {
    if (this.userAccessLevel === 'Edit Restricted') {
      // Edit Restricted users can edit everything EXCEPT CRM and Level
      if (edit === 'crm' || edit === 'level') {
        return false;
      }
      return true; // Can edit everything else
    }
    else if (this.userAccessLevel === 'Full') {
      return true; // Can edit everything
    }
    
    return false; // No access
  }
  
  constructor(private route: ActivatedRoute, private dataService: RiskMonitoringService, private http: HttpClient, private loginService: LoginService, private riskService: DataService, private router: Router) { 
    
  }

  ngOnInit(): void {    
    // Get userAccessLevel from DataService (passed from risk-monitoring component)
    const dataServiceData = this.riskService.getData();
    this.userAccessLevel = dataServiceData['userAccessLevel'] || 'No Access';

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
      this.Level = Level;

      this.ARGrossBalanceNeg = ARGrossBalance*-1;        
      this.IneligibleNeg = Ineligible*-1;    
      this.NFENeg = NFE*-1;     
      this.ReserveNeg = Reserve*-1;     
      this.AvailabilityNeg = Availability*-1;                
      
      if (this.checkLevel()) {        
        this.bgcolor = '2px solid red';
      }
    });           
    

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
    //       } else if (element.NavOption == 'Risk Monitoring'){
    //         this.NavOptionRiskMonitoring = element.NavOption;          
    //         this.NavAccessRiskMonitoring = element.NavAccess;
    //       } else if (element.NavOption == 'Risk Monitoring Restricted'){
    //         this.NavOptionRiskMonitoringRestricted = element.NavOption;          
    //         this.NavAccessRiskMonitoringRestricted = element.NavAccess;                        
    //       } else {
    //         this.NavOptionMasterDebtor = '';
    //         this.NavAccessMasterDebtor = '';
    //         this.NavOptionClientRisk = '';
    //         this.NavAccessClientRisk = '';       
    //         this.NavOptionUpdateMasterDebtor = '';       
    //         this.NavAccessUpdateMasterDebtor = ''; 
    //         this.NavOptionRiskMonitoring = '';
    //         this.NavAccessRiskMonitoring = '';
    //         this.NavOptionRiskMonitoringRestricted = '';
    //         this.NavAccessRiskMonitoringRestricted = '';
    //       }                                           
                      
    //     });
    //   }, error => {
    //     console.error('error--', error);
    //   });
    // });

    this.loadClientDetails(this.ClientKey); 
    this.loadClientContactsDetails(this.ClientKey);
    this.loadMonitoringCategories();
    this.loadMonitoringNotes(this.ClientKey);
    this.loadClientCRMList();
    this.loadClientGroupLevelList();
    this.checkLevel();
    
    this.loadClientSummary(this.ClientKey);
  }  

  ngAfterViewInit() {
    // After the view is initialized, you can get the text content of the span
    const hiddenNotesSpanText = this.spanElement.nativeElement.innerText;
    this.hiddenNotesSpanText = hiddenNotesSpanText;
    const hideNoteSpanText = this.spanHideElement?.nativeElement.innerText;
    this.hideNoteSpanText = hideNoteSpanText;    
  }
 
  checkLevel(): boolean {    
    if (!this.Level || typeof this.Level !== 'string') {      
      return false;
    }
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
      console.log('Client Details: ', data);        
      this.client = data.ClientDetails[0];      
      this.LevelHistory = data.LevelHistory;      
      this.Level = data.ClientLevelDetail[0].GroupValue;
      this.CRM = data.ClientDetails[0].AcctExec; // store CRM value
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
    if (this.userAccessLevel !== 'Full') {
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to add notes. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    this.http.get(GRAPH_ENDPOINT)
    .subscribe(profile => {
      this.profile = profile;          
      var userId = this.profile.mail.match(/^([^@]*)@/)[1];
      this.user = userId 
    });

    this.dataService.addNotesRisk(this.ClientKey, this.note_category===''?'Other':this.note_category, this.note, '', '1', this.user, this.due_date).subscribe(response => {      
      // window.location.reload();
      if (response.result){
        this.loadMonitoringNotes(this.ClientKey); // reload tasks after added note

        // Clear form fields after successful addition
        this.note_category = '';
        this.due_date = '';
        this.note = '';

        this._snackBar.openFromComponent(SuccessSnackbarComponent, {
          data: { message: "Note added successfully" },
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      }
      else {
        this._snackBar.openFromComponent(WarningSnackbarComponent, {
          data: { message: "Failed to add note" },
          duration: 10000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
      }
    }, error => {
      // alert('Failed');
      this._snackBar.openFromComponent(ErrorSnackbarComponent, {
        data: { message: "Error adding note: " + error.error.message },
        duration: 10000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
    });
  }

  onChangeCRM(event: Event, ClientKey: string){
    if (this.userAccessLevel !== 'Full') {
      const selectElement = event.target as HTMLSelectElement;
      selectElement.value = this.CRM; // Revert to original value
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to change CRM. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    const originalCRM = this.CRM; // Store the original CRM
    const selectElement = event.target as HTMLSelectElement; 
    const confirmed = window.confirm('Are you sure you want to update the CRM?');
    if (confirmed) {
      this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId 
      });         
      let crm = selectElement.value;
      let UserKey = this.user;

      this.dataService.updateCRMRisk(ClientKey, crm, UserKey).subscribe(
        response => {           
          if (response.result){
            this.CRM = crm; // Update local state
            this._snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: { message: "CRM updated successfully" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }
          else {
            selectElement.value = originalCRM; // Update failed, revert the dropdown
            this._snackBar.openFromComponent(WarningSnackbarComponent, {
              data: { message: "Failed to update CRM" },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }
        },
        error => {
          // alert("error");
          selectElement.value = originalCRM; // Update failed, revert the dropdown
          this._snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: { message: "Error updating CRM: " + error.error.message },
            duration: 10000,
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
        }              
      )
    } else {      
      // window.location.reload();
      selectElement.value = originalCRM; // Update failed, revert the dropdown
      console.log('Update cancelled');
    }
  };

  onChangeLevel(event: Event, ClientKey: string){
    if (this.userAccessLevel !== 'Full') {
      const selectElement = event.target as HTMLSelectElement;
      selectElement.value = this.Level; // Revert to original value
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to change Level. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    const originalLevel = this.Level; // Store the original level
    const selectElement = event.target as HTMLSelectElement;  
    const confirmed = window.confirm('Are you sure you want to update the Level?');
    if (confirmed) {
      this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;          
        var userId = this.profile.mail.match(/^([^@]*)@/)[1];
        this.user = userId 
      });
              
      let GroupValue = selectElement.value;
      let UserKey = this.user;
  
      this.dataService.updateLevelRisk(ClientKey, GroupValue, UserKey).subscribe(
        response => {
          console.log('response: ', response);
          if (response.result){
            this.loadMonitoringNotes(this.ClientKey); // reload tasks after updated level
            this.Level = GroupValue; // Update local state

            // update CRM for new value
            this.loadClientDetails(parseInt(ClientKey));
            this._snackBar.openFromComponent(SuccessSnackbarComponent, {
              data: { message: "Level updated successfully" },
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });

             // Check if level is changed to "Inactive" and auto-set CRM to "FALI"
            // if (GroupValue.toLowerCase() === 'inactive') {
            //   this.autoSetCRMToFALI(ClientKey);
            // } else {
            //   this._snackBar.openFromComponent(SuccessSnackbarComponent, {
            //     data: { message: "Level updated successfully" },
            //     duration: 5000,
            //     verticalPosition: 'top',
            //     horizontalPosition: 'center'
            //   });
            // }
          }
          else {
            selectElement.value = originalLevel; // Update failed, revert the dropdown
            this._snackBar.openFromComponent(WarningSnackbarComponent, {
              data: { message: "Failed to update level" },
              duration: 10000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }    
          // window.location.reload();
        },
        error => {
          // alert("error");
          selectElement.value = originalLevel; // Update failed, revert the dropdown
          this._snackBar.openFromComponent(ErrorSnackbarComponent, {
            data: { message: "Error updating level: " + error.error.message },
            duration: 10000,
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
        }              
      )
    } else {      
      // window.location.reload();
      selectElement.value = originalLevel; // Update failed, revert the dropdown
      console.log('Update cancelled');
    }    
  };

  // private autoSetCRMToFALI(ClientKey: string): void {
  //   // Check if "FALI" exists in the CRM list
  //   const faliCRM = this.clientCRMList?.find((crm: any) => crm.UserKey === 'FALI');

  //   if (faliCRM && this.client && this.client.AcctExec !== 'FALI') {
  //     // Update CRM to FALI using existing API call
  //     this.dataService.updateCRMRisk(ClientKey, 'FALI', this.user).subscribe(
  //       response => {
  //         if (response.result) {
  //           // Update local client object
  //           this.client.AcctExec = 'FALI';
  //           this.CRM = 'FALI';

  //           this._snackBar.openFromComponent(SuccessSnackbarComponent, {
  //             data: { message: "Level updated to Inactive. CRM automatically set to FALI." },
  //             duration: 6000,
  //             verticalPosition: 'top',
  //             horizontalPosition: 'center'
  //           });
  //         } else {
  //           // Level was updated but CRM update failed
  //           this._snackBar.openFromComponent(WarningSnackbarComponent, {
  //             data: { message: "Level updated successfully, but failed to set CRM to FALI" },
  //             duration: 6000,
  //             verticalPosition: 'top',
  //             horizontalPosition: 'center'
  //           });
  //         }
  //       },
  //       error => {
  //         console.error('Error auto-setting CRM to FALI:', error);
  //         this._snackBar.openFromComponent(WarningSnackbarComponent, {
  //           data: { message: "Level updated successfully, but error setting CRM to FALI" },
  //           duration: 6000,
  //           verticalPosition: 'top',
  //           horizontalPosition: 'center'
  //         });
  //       }
  //     );
  //   } else if (!faliCRM) {
  //     // FALI doesn't exist in CRM list
  //     this._snackBar.openFromComponent(WarningSnackbarComponent, {
  //       data: { message: "Level updated successfully. FALI not available in CRM list." },
  //       duration: 6000,
  //       verticalPosition: 'top',
  //       horizontalPosition: 'center'
  //     });
  //   } else {
  //     // CRM is already FALI or no client data
  //     this._snackBar.openFromComponent(SuccessSnackbarComponent, {
  //       data: { message: "Level updated successfully" },
  //       duration: 5000,
  //       verticalPosition: 'top',
  //       horizontalPosition: 'center'
  //     });
  //   }
  // }

  onChangeCompleteStatus(event: Event){
    if (this.userAccessLevel !== 'Full') {
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to change complete status. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

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
    if (this.userAccessLevel !== 'Full') {
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to change complete status. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

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
    if (this.userAccessLevel !== 'Full') {
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to hide/unhide notes. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

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

  // Get client summary text from API
  loadClientSummary(clientKey: number): void {
    this.dataService.getClientSummaryNote(clientKey).subscribe({
      next: (response) => {
        // console.log('Client summary response:', response);
        if (response && response.ClientSummaryNote && response.ClientSummaryNote[0].TermDesc.length > 0) {
          this.clientSummary = response.ClientSummaryNote[0].TermDesc || '';
        } else {
          this.clientSummary = '';
        }
      },
      error: (error) => {
        console.error('Error fetching client summary:', error);
        this.clientSummary = '';
      }
    });
  }

  // Update client summary text
  updateClientSummary(): void {
    if (this.userAccessLevel !== 'Full') {
      this._snackBar.openFromComponent(WarningSnackbarComponent, {
        data: { message: "You don't have permission to update client summary. Full access required." },
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    if (!this.ClientKey) {
      console.error('Client key is missing');
      return;
    }

    // Open SweetAlert2 dialog with textarea input
    Swal.fire({
      title: 'Update Client Summary',
      input: 'textarea',
      inputLabel: 'Client Summary',
      inputValue: this.extractSummaryText(this.clientSummary) || '',
      inputPlaceholder: 'Enter client summary text...',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputAttributes: {
        'aria-label': 'Client summary text',
        'rows': '8'
      },
      customClass: {
        input: 'swal2-textarea-large',
        popup: 'swal2-wide-popup'
      },
      preConfirm: (summaryText) => {
        // You can perform validation here if needed
        return summaryText;
      }
    }).then((result) => {
      // If user confirms the dialog and provides text
      if (result.isConfirmed && result.value !== undefined) {
        // Get current user info
        this.http.get(GRAPH_ENDPOINT).subscribe(profile => {
          this.profile = profile;          
          const userId = this.profile.mail.match(/^([^@]*)@/)[1];
          const currentDate = new Date().toISOString();
          
          // Format: "summaryText|userId|timestamp"
          const formattedSummary = `${result.value}|${userId.toUpperCase()}|${currentDate}`;
          this.clientSummary = formattedSummary;
          
          // Call API to update the summary
          this.dataService.setClientSummaryNote(this.ClientKey, formattedSummary).subscribe({
            next: (response) => {
              console.log('Client summary updated successfully');
              // Show success message with SweetAlert2
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Client summary updated successfully',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error updating client summary:', error);
              // Show error message with SweetAlert2
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update client summary'
              });
            }
          });
        });
      }
    });
  }

  // Helper method to extract summary text from the formatted string
  extractSummaryText(formattedSummary: string): string {
    if (!formattedSummary || formattedSummary === 'N/A') {
      return '';
    }
    
    const parts = formattedSummary.split('|');
    if (parts.length >= 1) {
      return parts[0];
    }
    return formattedSummary; // Return the whole string if it can't be parsed
  }

  // Helper method to extract user ID from the formatted string
  extractUserId(formattedSummary: string): string {
    if (!formattedSummary || formattedSummary === 'N/A') {
      return 'Unknown';
    }
    
    const parts = formattedSummary.split('|');
    if (parts.length >= 2) {
      return parts[1];
    }
    return 'Unknown';
  }

  // Helper method to extract and format date from the formatted string
  extractDate(formattedSummary: string): string {
    if (!formattedSummary || formattedSummary === 'N/A') {
      return '';
    }
    
    const parts = formattedSummary.split('|');
    if (parts.length >= 3) {
      try {
        const date = new Date(parts[2]);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      } catch (e) {
        return '';
      }
    }
    return '';
  }

}
