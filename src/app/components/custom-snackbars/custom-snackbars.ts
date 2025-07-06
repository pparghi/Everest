import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'success-snackbar',
  template: `
    <span matSnackBarLabel>
      <mat-icon class="success-icon">check_circle</mat-icon>
      {{message}}
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="snackBarRef.dismissWithAction()">Close</button>
    </span>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
    }
    .success-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #4caf50;
    }
  `,
  standalone: true,
  imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction, MatIconModule],
})
export class SuccessSnackbarComponent {
  message: string = 'Success';
  snackBarRef = inject(MatSnackBarRef);
  
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data?.message || 'Operation completed successfully';
  }
}

@Component({
  selector: 'warning-snackbar',
  template: `
    <span matSnackBarLabel>
      <mat-icon class="warning-icon">warning</mat-icon>
      {{message}}
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="snackBarRef.dismissWithAction()">Close</button>
    </span>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
    }
    .warning-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #ff9800;
    }
  `,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
})
export class WarningSnackbarComponent {
  message: string = 'Warning';
  snackBarRef = inject(MatSnackBarRef);
  
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data?.message || 'Warning';
  }
}

@Component({
  selector: 'error-snackbar',
  template: `
    <span matSnackBarLabel>
      <mat-icon class="error-icon">error</mat-icon>
      {{message}}
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="snackBarRef.dismissWithAction()">Close</button>
    </span>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
    }
    .error-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #f44336;
    }
  `,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
})
export class ErrorSnackbarComponent {
  message: string = 'Error';
  snackBarRef = inject(MatSnackBarRef);
  
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data?.message || 'An error occurred';
  }
}