import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-timesheet-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
  templateUrl: './timesheet-entry.page.html',
  styleUrls: ['./timesheet-entry.page.scss'],
})
export class TimesheetEntryPage {
  isReadOnly: boolean[] = [false, false, false, false, false, false, false];
  isEditable: boolean = false;
  isEditing: boolean = false;
  isWeekend:  boolean[] =[];
  startDate: Date;
  days: string[] = [];
  workedHours: number[] = [0, 0, 0, 0, 0, 0, 0];
  leaveHours: number[] = [0, 0, 0, 0, 0, 0, 0];
  projectId: string = '';
  projectName: string = '';
  selectedYear: number = 2025;
  selectedMonth: string = 'Jan';
  years: number[] = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  employeeId: string = ''; 
  holidays: string[] = [];
  
  backupWorkedHours: any[] = [];
  backupLeaveHours: any[] = [];
  
  constructor(
    private router: Router,
    private alertController: AlertController,
    private http: HttpClient,
    private menuCtrl: MenuController
  ) {

    // Get the current date
  const today = new Date();
  this.selectedYear = today.getFullYear();
  this.selectedMonth = this.months[today.getMonth()]; 
  // Get the month as string
    // Initialize startDate and generate the week
    this.startDate = this.getCurrentWeekMonday();
    console.log("Initial startDate:", this.startDate);
    this.generateWeekDates();
  }

  // ------------------------------------------------------------
  // Lifecycle Hooks
  // ------------------------------------------------------------

  ngOnInit() {
    this.employeeId = localStorage.getItem('employeeId') || '';
    if (this.employeeId) {
      this. ionViewWillEnter();
      this.fetchProjectDetails();
      this.fetchTimesheetData();
      this.fetchLeaveData();
    } else {
      console.error("No Employee ID found in localStorage");
    }
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'first'); // Enable the menu when entering the page
  }


  // ------------------------------------------------------------
  // Date and Week Management
  // ------------------------------------------------------------
  getCurrentWeekMonday(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    today.setDate(diff);
    today.setHours(0, 0, 0, 0);
    console.log("Calculated current week Monday:", today);
    return today;
  }

  generateWeekDates() {
  let currentDate = new Date(this.startDate);
  const dayOfWeek = currentDate.getDay();
  const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  currentDate.setDate(diff);

  this.startDate = new Date(currentDate);
  this.days = [];
  this.isReadOnly = []; // Reset read-only states
  this.isWeekend = [];
  for (let i = 0; i < 7; i++) {
    const formattedDate = this.formatDate(currentDate);
    this.days.push(formattedDate);
    const dayNumber = currentDate.getDay();
      this.isWeekend[i] = (dayNumber === 6 || dayNumber === 0); // Saturday (6) or Sunday (0)

    // Check if the date is a holiday
    const isoDate = currentDate.toISOString().split('T')[0];
    this.isReadOnly[i] = this.holidays.includes(isoDate); 

    currentDate.setDate(currentDate.getDate() + 1);
  }

  this.fetchTimesheetData();
  this.fetchLeaveData();
}


  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  previous() {
    this.startDate.setDate(this.startDate.getDate() - 7);
    this.generateWeekDates();
    this.resetHours();
  }

  next() {
    this.startDate.setDate(this.startDate.getDate() + 7);
    this.generateWeekDates();
    this.resetHours();
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.detail.value;
    this.onYearOrMonthChange();
    // Remove extra day adjustment if not needed
    console.log("Selected Month:", this.selectedMonth);
    this.resetHours();
  }

  onYearOrMonthChange() {
    if (!this.selectedMonth) {
      this.selectedMonth = this.months[new Date().getMonth()];
    }
    const monthIndex = this.months.indexOf(this.selectedMonth);
    this.startDate = new Date(this.selectedYear, monthIndex, 1);
    console.log("Updated Month Selection:", this.selectedMonth, "| Month Index:", monthIndex);
    console.log("Final Start Date:", this.startDate.toISOString());
    this.generateWeekDates();
  }

  resetHours() {
    this.workedHours = [0, 0, 0, 0, 0, 0, 0];
    this.leaveHours = [0, 0, 0, 0, 0, 0, 0];
  }

  getEndDate(): string {
    const endDate = new Date(this.startDate);
    endDate.setDate(this.startDate.getDate() + 7);
    return endDate.toISOString().split('T')[0];
  }

  // getTotal(hoursArray: number[]): number {
  //   return this.leaveHours
    
  //   .map(hour => isNaN(Number(hour)) ? 0 : Number(hour))  // Convert non-numeric values (like "Holiday") to 0
  //   .reduce((total, hour) => total + hour, 0);
  // }

  getTotal(hoursArray: any[]): number {
    return hoursArray
      .map(hour => (isNaN(Number(hour)) || hour === "Holiday") ? 0 : Number(hour)) // Convert non-numeric values to 0
      .reduce((total, hour) => total + hour, 0);
  }
  

  getTotalHours(): number { 
    return this.workedHours
    
        .map(hour => isNaN(Number(hour)) ? 0 : Number(hour))  // Convert non-numeric values (like "Holiday") to 0
        .reduce((total, hour) => total + hour, 0);
}


isHoliday(date: any): boolean {
  const formattedDate = new Date(date).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
  return this.holidays.includes(formattedDate);
}
  // ------------------------------------------------------------
  // Data Submission
  // ------------------------------------------------------------
  // async submitAll() {
  //   let isValid = true;
  //   let isLeaveValid = true;

    
  //   for (let i = 0; i < 7; i++) {
  //     if ((this.workedHours[i] || 0) + (this.leaveHours[i] || 0) > 0) {
  //       if ((this.workedHours[i] || 0) + (this.leaveHours[i] || 0) < 8) {
  //         isValid = false;
  //         break;
  //       }
  //     }
  //     if (this.leaveHours[i] > 8) {
  //       isLeaveValid = false;
  //       break;
  //     }
  //   }
  //   if (!isLeaveValid) {
  //     const leaveAlert = await this.alertController.create({
  //       header: 'Error',
  //       message: 'Leave hours cannot exceed 8.',
  //       buttons: ['OK'],
  //       cssClass: 'error-alert',
  //     });
  //     await leaveAlert.present();
  //     return;
  //   }
  //   if (!isValid) {
  //     const errorAlert = await this.alertController.create({
  //       header: 'Error',
  //       message: 'Worked hours + Leave hours must be at least 8 when entered.',
  //       buttons: ['OK'],
  //       cssClass: 'error-alert',
  //     });
  //     await errorAlert.present();
  //     return;
  //   }

  //   const timesheetData = {
  //     Employee_Id: this.employeeId,
  //     Project_Id: this.projectId,
  //     Timesheet_Start_Date: this.startDate.toLocaleDateString('en-CA'),
  //     Timesheet_End_Date: this.getEndDate(),
  //     Day1_Hrs: this.workedHours[0] || 0,
  //     Day2_Hrs: this.workedHours[1] || 0,
  //     Day3_Hrs: this.workedHours[2] || 0,
  //     Day4_Hrs: this.workedHours[3] || 0,
  //     Day5_Hrs: this.workedHours[4] || 0,
  //     Day6_Hrs: this.workedHours[5] || 0,
  //     Day7_Hrs: this.workedHours[6] || 0,
  //     Total_Hrs: this.getTotal(this.workedHours),
  //   };

  //   const leaveData = {
  //     Employee_Id: this.employeeId,
  //     Project_Id: this.projectId,
  //     Leave_Start_Date: this.startDate.toLocaleDateString('en-CA'),
  //     Leave_End_Date: this.getEndDate(),
  //     Day1_Hrs: this.leaveHours[0] || 0,
  //     Day2_Hrs: this.leaveHours[1] || 0,
  //     Day3_Hrs: this.leaveHours[2] || 0,
  //     Day4_Hrs: this.leaveHours[3] || 0,
  //     Day5_Hrs: this.leaveHours[4] || 0,
  //     Day6_Hrs: this.leaveHours[5] || 0,
  //     Day7_Hrs: this.leaveHours[6] || 0,
  //     Total_Hrs: this.getTotal(this.leaveHours),
  //   };

  //   try {
  //     const timesheetResponse = await this.http
  //       .post('http://localhost:2025/project/submitTimesheet', timesheetData)
  //       .toPromise();
  //     console.log('Timesheet submitted successfully:', timesheetResponse);

  //     const leaveResponse = await this.http
  //       .post('http://localhost:2025/project/submitLeave', leaveData)
  //       .toPromise();
  //     console.log('Leave submitted successfully:', leaveResponse);

  //     const successAlert = await this.alertController.create({
  //       header: 'Success',
  //       message: 'Your timesheet and leave request have been successfully submitted!',
  //       buttons: ['OK'],
  //       cssClass: 'success-alert',
  //     });
  //     await successAlert.present();
  //     this.resetHours();
  //     this.fetchTimesheetData();
  //     this.fetchLeaveData();
  //   } catch (error) {
  //     console.error('Error submitting both leave and timesheet:', error);
  //     const errorAlert = await this.alertController.create({
  //       header: 'Error',
  //       message: 'Failed to submit timesheet and leave. Please try again later.',
  //       buttons: ['OK'],
  //       cssClass: 'error-alert',
  //     });
  //     await errorAlert.present();
  //   }
  // }
   
async submitAll() {
  let isValid = true;
  let isLeaveValid = true;
  let allWeekdaysFilled = true; // Track if all weekdays have values

  // Check if all worked hours and leave hours are 0
  const hasWorkedHours = this.workedHours.some(hour => hour > 0);
  const hasLeaveHours = this.leaveHours.some(hour => hour > 0);

  if (!hasWorkedHours && !hasLeaveHours) {
    const errorAlert = await this.alertController.create({
      header: 'Error',
      message: 'Timesheet cannot be submitted with all hours as 0.',
      buttons: ['OK'],
      cssClass: 'error-alert',
    });
    await errorAlert.present();
    return;
  }

  // Validation for worked hours and leave hours
  for (let i = 0; i < 5; i++) { // Only check Monday to Friday (0 to 4)
    if ((this.workedHours[i] || 0) + (this.leaveHours[i] || 0) === 0) {
      allWeekdaysFilled = false;
      break;
    }
    if ((this.workedHours[i] || 0) + (this.leaveHours[i] || 0) > 0 &&
        (this.workedHours[i] || 0) + (this.leaveHours[i] || 0) < 8) {
      isValid = false;
      break;
    }
    if (this.leaveHours[i] > 8) {
      isLeaveValid = false;
      break;
    }
  }

  if (!allWeekdaysFilled) {
    const errorAlert = await this.alertController.create({
      header: 'Error',
      message: 'Hours must be entered for all weekdays (Monday to Friday).',
      buttons: ['OK'],
      cssClass: 'error-alert',
    });
    await errorAlert.present();
    return;
  }

  if (!isLeaveValid) {
    const leaveAlert = await this.alertController.create({
      header: 'Error',
      message: 'Leave hours cannot exceed 8.',
      buttons: ['OK'],
      cssClass: 'error-alert',
    });
    await leaveAlert.present();
    return;
  }

  if (!isValid) {
    const errorAlert = await this.alertController.create({
      header: 'Error',
      message: 'Worked hours + Leave hours must be at least 8 when entered.',
      buttons: ['OK'],
      cssClass: 'error-alert',
    });
    await errorAlert.present();
    return;
  }

  // Create timesheet data only if worked hours are present
  let timesheetData;
  if (hasWorkedHours) {
    timesheetData = {
      Employee_Id: this.employeeId,
      Project_Id: this.projectId,
      Timesheet_Start_Date: this.startDate.toLocaleDateString('en-CA'),
      Timesheet_End_Date: this.getEndDate(),
      Day1_Hrs: this.workedHours[0] || 0,
      Day2_Hrs: this.workedHours[1] || 0,
      Day3_Hrs: this.workedHours[2] || 0,
      Day4_Hrs: this.workedHours[3] || 0,
      Day5_Hrs: this.workedHours[4] || 0,
      Day6_Hrs: this.workedHours[5] || 0, // Sat (can be 0)
      Day7_Hrs: this.workedHours[6] || 0, // Sun (can be 0)
      Total_Hrs: this.getTotal(this.workedHours),
    };
  }

  // Create leave data only if leave hours are present
  let leaveData;
  if (hasLeaveHours) {
    leaveData = {
      Employee_Id: this.employeeId,
      Project_Id: this.projectId,
      Leave_Start_Date: this.startDate.toLocaleDateString('en-CA'),
      Leave_End_Date: this.getEndDate(),
      Day1_Hrs: this.leaveHours[0] || 0,
      Day2_Hrs: this.leaveHours[1] || 0,
      Day3_Hrs: this.leaveHours[2] || 0,
      Day4_Hrs: this.leaveHours[3] || 0,
      Day5_Hrs: this.leaveHours[4] || 0,
      Day6_Hrs: this.leaveHours[5] || 0, // Sat (can be 0)
      Day7_Hrs: this.leaveHours[6] || 0, // Sun (can be 0)
      Total_Hrs: this.getTotal(this.leaveHours),
    };
  }

  try {
    if (hasWorkedHours) {
      const timesheetResponse = await this.http
        .post('http://localhost:2025/project/submitTimesheet', timesheetData)
        .toPromise();
      console.log('Timesheet submitted successfully:', timesheetResponse);
    }

    if (hasLeaveHours) {
      const leaveResponse = await this.http
        .post('http://localhost:2025/project/submitLeave', leaveData)
        .toPromise();
      console.log('Leave submitted successfully:', leaveResponse);
    }

    const successAlert = await this.alertController.create({
      header: 'Success',
      message: 'Your timesheet and leave request have been successfully submitted!',
      buttons: ['OK'],
      cssClass: 'success-alert',
    });
    await successAlert.present();
    this.resetHours();
    this.fetchTimesheetData();
    this.fetchLeaveData();
  } catch (error) {
    console.error('Error submitting both leave and timesheet:', error);
    const errorAlert = await this.alertController.create({
      header: 'Error',
      message: 'Failed to submit timesheet and leave. Please try again later.',
      buttons: ['OK'],
      cssClass: 'error-alert',
    });
    await errorAlert.present();
  }
}
  // ------------------------------------------------------------
  // API Calls: Fetch Data
  // ------------------------------------------------------------
  fetchProjectDetails() {
    if (this.employeeId) {
      this.http.get<any>(`http://localhost:2025/project/getProject/${this.employeeId}`).subscribe(
        (response) => {
          if (response) {
            this.projectId = response.Project_ID;
            this.projectName = response.Project_Name;

            //newly added 
            // Now that projectId is set, fetch timesheet data
          this.fetchTimesheetData();
          this.fetchLeaveData();

          } else {
            console.warn("No project found for this employee.");
          }
        },
        (error) => {
          console.error("Error fetching project details:", error);
        }
      );
    } else {
      console.error("Employee ID is missing!");
    }
  }

  fetchTimesheetData() {
    const url = `http://localhost:2025/project/getTimesheet/${this.employeeId}/${this.projectId}/${this.startDate.toLocaleDateString('en-CA')}`;
    console.log("Fetching timesheet data for date:", this.startDate.toLocaleDateString('en-CA'));
    this.http.get<any>(url).subscribe(
      (response) => {
        if (response && !response.message) {
          this.workedHours = [
            response.Day1_Hrs || 0,
            response.Day2_Hrs || 0,
            response.Day3_Hrs || 0,
            response.Day4_Hrs || 0,
            response.Day5_Hrs || 0,
            response.Day6_Hrs || 0,
            response.Day7_Hrs || 0
          ];
          
          // Make fields non-editable only if a value is fetched (not 0)
          // this.isReadOnly = this.workedHours.map(value => value > 0);
           // Set fields as readonly only if values are fetched (not 0)
  //       this.isReadOnly = this.workedHours.map(value => value !== 0);
  //       } else {
  //         console.warn("No timesheet data found.");
  //       }
  //     },
  //     (error) => {
  //       console.error("Error fetching timesheet data:", error);
  //     }
  //   );
  // }

} else {
  console.warn("No timesheet data found.");
  this.workedHours = [0, 0, 0, 0, 0, 0, 0];
}
this.updateReadOnlyStatus();  // Ensure readonly status is updated
},
(error) => {
console.error("Error fetching timesheet data:", error);
this.workedHours = [0, 0, 0, 0, 0, 0, 0];
this.updateReadOnlyStatus();
}
);
}
  
  fetchLeaveData() {
    if (!this.employeeId || !this.projectId) return;
    const url = `http://localhost:2025/project/getLeaveRecords/${this.employeeId}/${this.projectId}/${this.startDate.toLocaleDateString('en-CA')}`;
    this.http.get<any>(url).subscribe(
      (response) => {
        if (response && !response.message) {
          this.leaveHours = [
            response.Day1_Hrs || 0,
            response.Day2_Hrs || 0,
            response.Day3_Hrs || 0,
            response.Day4_Hrs || 0,
            response.Day5_Hrs || 0,
            response.Day6_Hrs || 0,
            response.Day7_Hrs || 0
          ];
          console.log("Leave Data Fetched:", this.leaveHours);
          
          // Make fields non-editable only if a value is fetched (not 0)
          // this.isReadOnly = this.leaveHours.map(value => value > 0);

          // Set fields as readonly only if values are fetched (not 0)
  //       this.isReadOnly = this.leaveHours.map(value => value !== 0);

  //       } else {
  //         console.warn("No leave data found.");
  //         this.leaveHours = [0, 0, 0, 0, 0, 0, 0];
  //       }
  //     },
  //     (error) => {
  //       console.error("Error fetching leave data:", error);
  //       this.leaveHours = [0, 0, 0, 0, 0, 0, 0];
  //     }
  //   );
  // }
} else {
  console.warn("No leave data found.");
  this.leaveHours = [0, 0, 0, 0, 0, 0, 0];
}
this.updateReadOnlyStatus();  // Ensure readonly status is updated
},
(error) => {
console.error("Error fetching leave data:", error);
this.leaveHours = [0, 0, 0, 0, 0, 0, 0];
this.updateReadOnlyStatus();
}
);
}
updateReadOnlyStatus() {
  this.isReadOnly = this.workedHours.map((worked, index) => 
    worked !== 0 || this.leaveHours[index] !== 0
  );
}


  // ------------------------------------------------------------
  // Event Handlers for Hours Changes
  // ------------------------------------------------------------
  onLeaveHoursChange(index: number, event: any) {
    let inputLeaveHours = event.target.value ? parseInt(event.target.value, 10) : 0;
    if (inputLeaveHours > 8) {
      // this.leaveHours[index] = 8;
      alert("Leave hours cannot exceed 8.");
      event.target.value = ""; // Clear the input field
      return; // Stop further execution
    } else {
      this.leaveHours[index] = inputLeaveHours;
    }
  }

//   onWorkedHoursChange(index: number, event: any) {
//     let inputWorkedHours = event.target.value ? parseInt(event.target.value, 10) : 0;
//     if (inputWorkedHours > 24) {
//       this.workedHours[index] = 24;
//       alert(" Worked hours cannot exceed 24.");
//     } else {
//     this.workedHours[index] = inputWorkedHours;
//   }
// }

  // ------------------------------------------------------------
  // Utility: Show Error Alert
  // ------------------------------------------------------------
 
 
  // onWorkedHoursChange(index: number, event: any) {
  //   let inputWorkedHours = event.target.value ? parseInt(event.target.value, 10) : 0;
  
  //   if (inputWorkedHours > 24) {
  //     alert("Worked hours cannot exceed 24.");
  //     event.target.value = ""; // Clear the input field
  //     return; // Stop further execution
  //   }
  
  //   this.workedHours[index] = inputWorkedHours;
  // }
  async onWorkedHoursChange(index: number, event: any) {
    let inputWorkedHours = event.target.value ? parseInt(event.target.value, 10) : 0;
  
    if (inputWorkedHours > 24) {
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Worked hours cannot exceed 24.',
        buttons: ['OK'],
        cssClass: 'error-alert',
      });
  
      await errorAlert.present(); // Show alert
  
      event.target.value = ""; // Clear the input field
      return; // Stop further execution
    }
  
    this.workedHours[index] = inputWorkedHours;
  }

  showErrorMessage(message: string) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Error';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    return alert.present();
  }

  // ------------------------------------------------------------
  // UI State Toggles
  // ------------------------------------------------------------
  // editHours() {
  //   this.isEditable = !this.isEditable;
  // }

  // toggleEdit() {
  //   this.isEditing = !this.isEditing;
  // }
  
  toggleReadOnly() {
    this.isReadOnly = this.isReadOnly.map(readOnly => !readOnly);
  }

  // ------------------------------------------------------------
  // Approve / Reject Timesheet (Admin)
  // ------------------------------------------------------------
  approveTimesheet(timesheetId: string) {
    this.http.put(`/api/updateTimesheetStatus/${timesheetId}`, { status: "Approved" })
      .subscribe(response => {
        console.log("Timesheet Approved:", response);
      });
  }
  
  rejectTimesheet(timesheetId: string) {
    this.http.put(`/api/updateTimesheetStatus/${timesheetId}`, { status: "Rejected" })
      .subscribe(response => {
        console.log("Timesheet Rejected:", response);
      });
  }
  
  editHours() {
    this.isEditing = true;
    // Backup current values in case of cancel
    this.backupWorkedHours = [...this.workedHours];
    this.backupLeaveHours = [...this.leaveHours];
  }
  
  saveHours() {
    this.isEditing = false;
    // Handle the logic for saving the updated hours if needed
  }
  
  cancelEdit() {
    this.isEditing = false;
    // Restore previous values
    this.workedHours = [...this.backupWorkedHours];
    this.leaveHours = [...this.backupLeaveHours];
  }
}
