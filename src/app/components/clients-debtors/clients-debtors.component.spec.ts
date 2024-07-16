import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsDebtorsComponent } from './clients-debtors.component';

describe('ClientsDebtorsComponent', () => {
  let component: ClientsDebtorsComponent;
  let fixture: ComponentFixture<ClientsDebtorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientsDebtorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientsDebtorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
