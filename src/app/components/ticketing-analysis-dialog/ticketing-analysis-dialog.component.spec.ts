import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketingAnalysisDialogComponent } from './ticketing-analysis-dialog.component';

describe('TicketingAnalysisDialogComponent', () => {
  let component: TicketingAnalysisDialogComponent;
  let fixture: ComponentFixture<TicketingAnalysisDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TicketingAnalysisDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketingAnalysisDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
