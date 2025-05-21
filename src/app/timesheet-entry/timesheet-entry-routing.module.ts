import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TimesheetEntryPage } from './timesheet-entry.page';

const routes: Routes = [
  {
    path: '',
    component: TimesheetEntryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TimesheetEntryPageRoutingModule {}
