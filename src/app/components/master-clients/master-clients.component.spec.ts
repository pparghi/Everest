import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterClientsComponent } from './master-clients.component';

describe('MasterClientsComponent', () => {
  let component: MasterClientsComponent;
  let fixture: ComponentFixture<MasterClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterClientsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
