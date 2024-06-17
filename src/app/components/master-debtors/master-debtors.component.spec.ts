import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDebtorsComponent } from './master-debtors.component';

describe('MasterDebtorsComponent', () => {
  let component: MasterDebtorsComponent;
  let fixture: ComponentFixture<MasterDebtorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterDebtorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDebtorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
