import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TimesheetReportPage } from './timesheet-report.page';

const routes: Routes = [
  {
    path: '',
    component: TimesheetReportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TimesheetReportPageRoutingModule {}
