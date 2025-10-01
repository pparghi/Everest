import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface SettingsData {
  // Define the data structure that can be passed to this dialog
  title?: string;
  currentSettings?: any;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<SettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SettingsData,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentSettings();
  }

  private initializeForm(): void {
    this.settingsForm = this.formBuilder.group({
      CreditRequestNotificationSwitch: [false],
      CreditRequestNotificationIntervalMinutes: [10, [Validators.required, Validators.min(0), Validators.max(300)]],
    });
  }

  private loadCurrentSettings(): void {
    // First try to load from localStorage (most recent saved settings)
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        this.settingsForm.patchValue(parsedSettings);
        return; // Exit early if we successfully loaded from localStorage
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    
    // Fallback to injected data if localStorage is empty or invalid
    if (this.data?.currentSettings) {
      this.settingsForm.patchValue(this.data.currentSettings);
    }
  }

  onSave(): void {
    if (this.settingsForm.valid) {
      this.isLoading = true;
      
      const settings = this.settingsForm.value;

      // console.log('Saving settings:', settings);
      // save setting values to local session
      localStorage.setItem('settings', JSON.stringify(settings));

      this.isLoading = false;
      this.dialogRef.close(settings);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReset(): void {
    this.settingsForm.reset();
    // set default values after reset
    this.settingsForm.patchValue({
      CreditRequestNotificationSwitch: false,
      CreditRequestNotificationIntervalMinutes: 10
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.settingsForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('min')) {
      return 'Minimum value is 0 minutes.';
    }
    if (control?.hasError('max')) {
      return 'Maximum value is 300 minutes.';
    }
    return '';
  }

  testNotification(): void {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification.',
        icon: 'assets/images/Everest-Logo-square.png'
      });
    } 
    else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification.',
            icon: 'assets/images/Everest-Logo-square.png'
          });
        }
      });
    } 
    else if (Notification.permission === 'denied') {
      alert("Notification permission denied, please enable it in your browser settings");
    } 
    else {
      alert("This browser does not support desktop notification");
    }
    
  }

}
