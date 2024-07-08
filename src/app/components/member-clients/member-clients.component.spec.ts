import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberClientsComponent } from './member-clients.component';

describe('MemberClientsComponent', () => {
  let component: MemberClientsComponent;
  let fixture: ComponentFixture<MemberClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MemberClientsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MemberClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
