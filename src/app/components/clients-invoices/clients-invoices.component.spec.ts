import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsInvoicesComponent } from './clients-invoices.component';

describe('ClientsInvoicesComponent', () => {
  let component: ClientsInvoicesComponent;
  let fixture: ComponentFixture<ClientsInvoicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientsInvoicesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientsInvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
