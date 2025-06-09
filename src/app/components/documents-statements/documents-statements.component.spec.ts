import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsStatementsComponent } from './documents-statements.component';

describe('DocumentsStatementsComponent', () => {
  let component: DocumentsStatementsComponent;
  let fixture: ComponentFixture<DocumentsStatementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentsStatementsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentsStatementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
