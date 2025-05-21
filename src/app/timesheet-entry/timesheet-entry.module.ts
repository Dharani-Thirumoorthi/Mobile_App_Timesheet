import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TimesheetEntryPageRoutingModule } from './timesheet-entry-routing.module';

import { TimesheetEntryPage } from './timesheet-entry.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimesheetEntryPageRoutingModule
  ],
  declarations: [TimesheetEntryPage]
})
export class TimesheetEntryPageModule {}
