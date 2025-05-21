import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LeaveRequestsPageRoutingModule } from './leave-requests-routing.module';

import { LeaveRequestsPage } from './leave-requests.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LeaveRequestsPageRoutingModule
  ],
  declarations: [LeaveRequestsPage]
})
export class LeaveRequestsPageModule {}
