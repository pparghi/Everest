import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoticeOfAccessmentComponent } from './notice-of-accessment.component';

describe('NoticeOfAccessmentComponent', () => {
  let component: NoticeOfAccessmentComponent;
  let fixture: ComponentFixture<NoticeOfAccessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NoticeOfAccessmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NoticeOfAccessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
