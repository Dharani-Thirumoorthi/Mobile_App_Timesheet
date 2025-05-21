import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TimesheetReportPageRoutingModule } from './timesheet-report-routing.module';

import { TimesheetReportPage } from './timesheet-report.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimesheetReportPageRoutingModule
  ],
  declarations: [TimesheetReportPage]
})
export class TimesheetReportPageModule {}
