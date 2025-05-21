import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveRequestsPage } from './leave-requests.page';

describe('LeaveRequestsPage', () => {
  let component: LeaveRequestsPage;
  let fixture: ComponentFixture<LeaveRequestsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveRequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
