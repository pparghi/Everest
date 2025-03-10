import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketingMasterMemberDebtorsComponent } from './ticketing-master-member-debtors.component';

describe('TicketingMasterMemberDebtorsComponent', () => {
  let component: TicketingMasterMemberDebtorsComponent;
  let fixture: ComponentFixture<TicketingMasterMemberDebtorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TicketingMasterMemberDebtorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketingMasterMemberDebtorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
