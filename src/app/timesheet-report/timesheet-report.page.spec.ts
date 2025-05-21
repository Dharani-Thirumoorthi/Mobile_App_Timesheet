import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetReportPage } from './timesheet-report.page';

describe('TimesheetReportPage', () => {
  let component: TimesheetReportPage;
  let fixture: ComponentFixture<TimesheetReportPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
