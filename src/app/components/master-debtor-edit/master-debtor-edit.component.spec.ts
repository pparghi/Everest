import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDebtorEditComponent } from './master-debtor-edit.component';

describe('MasterDebtorEditComponent', () => {
  let component: MasterDebtorEditComponent;
  let fixture: ComponentFixture<MasterDebtorEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterDebtorEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDebtorEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
