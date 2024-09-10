import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberMasterDebtorComponent } from './member-master-debtor.component';

describe('MemberMasterDebtorComponent', () => {
  let component: MemberMasterDebtorComponent;
  let fixture: ComponentFixture<MemberMasterDebtorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MemberMasterDebtorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MemberMasterDebtorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
