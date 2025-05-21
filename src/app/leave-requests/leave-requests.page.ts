import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './leave-requests.page.html',
  styleUrls: ['./leave-requests.page.scss'],
})
export class LeaveRequestsPage {
  pendingRequests = [
    {
      employeeName: 'John Doe',
      projectId: 'P12345',
      projectName: 'Project Alpha',
      timesheetPeriod: '01/02/2024 - 07/02/2024',
      workedHours: '35 hrs',
      leaveHours: '5 hrs',
      status: 'Pending',
      type: 'Annual',
      typeColor: 'primary'
    }
  ];

  constructor(private router: Router,private alertController: AlertController) {}
  
    // Method to navigate to the Timesheet Entry page
    navigateToTimesheetEntry() {
      this.router.navigate(['/timesheet-entry']);
    }
  
    navigateToDashboard() {
      this.router.navigate(['/dashboard']);
    }
  
    navigateToCalendar() {
      this.router.navigate(['/calendar']);
    }
  
    navigateToTimesheetReport() {
      this.router.navigate(['/timesheet-report']);
    }
  
    navigateToExpenseSheet() {
      this.router.navigate(['/expense-sheet']);
    }
    async showContactUsAlert() {
      const alert = await this.alertController.create({
        header: 'Contact Us',
        message: `Email: timesheetsupport@shoubii.nett
        Phone: +1 234 567 890`,
        
        buttons: ['Close'],
        cssClass: 'custom-alert',
      });
  
      await alert.present();
    }
  
}
