import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgingDocumentsDialogComponent } from './aging-documents-dialog.component';

describe('AgingDocumentsDialogComponent', () => {
  let component: AgingDocumentsDialogComponent;
  let fixture: ComponentFixture<AgingDocumentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgingDocumentsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgingDocumentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
