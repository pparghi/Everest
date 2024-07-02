import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientRiskComponent } from './client-risk.component';

describe('ClientRiskComponent', () => {
  let component: ClientRiskComponent;
  let fixture: ComponentFixture<ClientRiskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientRiskComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientRiskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
