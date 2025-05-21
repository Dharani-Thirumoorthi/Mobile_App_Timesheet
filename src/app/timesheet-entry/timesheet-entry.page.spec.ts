import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetEntryPage } from './timesheet-entry.page';

describe('TimesheetEntryPage', () => {
  let component: TimesheetEntryPage;
  let fixture: ComponentFixture<TimesheetEntryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetEntryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
