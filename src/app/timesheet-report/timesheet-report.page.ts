import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';  // Import Router for navigation
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-timesheet-report',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
  templateUrl: './timesheet-report.page.html',
  styleUrls: ['./timesheet-report.page.scss'],
})
export class TimesheetReportPage implements OnInit {
  selectedStatus = 'all'; 
  employeeId: string = '';
  employeeName: string = '';
  projectId: string = '';
  projectName: string = '';
  status: string = '';
  timesheetPeriod: string = '';
  workedHours: string = '';
  leaveHours: string = '';
  startDate: string = '';
  endDate: string = '';
  isStartPickerVisible: boolean = false;
  isEndPickerVisible: boolean = false;
  employeeDetails: any[] = []; // Store API data
  originalEmployeeDetails: any[] = [];
  employeeRole: string = '';
  filterEmployeeId: string = '';
  loginEmployeeId: string = '';

  pendingRequests = [
    {
      employeeName: 'John Doe',
      projectId: 'P12345',
      projectName: 'Project Alpha',
      timesheetPeriod: '01/02/2024 - 07/02/2024',
      workedHours: '35 hrs',
      leaveHours: '5 hrs',
      status: 'Approved',
      type: 'Annual',
      typeColor: 'primary',
      
    }
  ];

  constructor(private router: Router,private alertController: AlertController, private http: HttpClient, private menuCtrl: MenuController) {}  // Inject Router into the constructor
  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'first'); // Enable the menu when entering the page
  }
  
  ngOnInit() {
    this.setDefaultDates();
    this.getEmployeeId();
    this.fetchEmployeeDetails();
    
  }

  getEmployeeId() {
    const storedEmployeeId = localStorage.getItem('employeeId');
    if (storedEmployeeId) {
      this.employeeId = storedEmployeeId;
      this.getEmployeeRole(); // Fetch Role first, then get summary
    } else {
      console.error('No employee ID found! User not logged in.');
    }
  }


  getEmployeeRole() {
    if (!this.employeeId) return;

    this.http
      .get<any>(`http://localhost:2025/project/getEmployeeRole/${this.employeeId}`)
      .subscribe(
        (response) => {
          if (response && response.employeeRole) {
            this.employeeRole = response.employeeRole;
            //this.getEmployeeSummary(); // Fetch summary after role is determined
          } else {
            console.error('Employee role not found');
          }
        },
        (error) => {
          console.error('Error fetching employee role:', error);
        }
      );
  }
  setDefaultDates() {
    const today = new Date();  // Get the current date
  
    // Get the current year and month
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based (Jan = 0, Feb = 1, ...)
  
    // Get the first day of the current month (UTC to avoid timezone shifts)
    const firstDay = new Date(Date.UTC(year, month, 1));
  
    // Get the last day of the current month (UTC to avoid timezone shifts)
    const lastDay = new Date(Date.UTC(year, month + 1, 0)); // Setting day=0 gives last day of previous month
  
    // Convert to YYYY-MM-DD format (forcing UTC to prevent local timezone shifts)
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];  // Extract only YYYY-MM-DD
    };
  
    this.startDate = formatDate(firstDay);
    this.endDate = formatDate(lastDay);
  
    console.log("Start Date:", this.startDate); // Should be 2025-02-01 if today is in Feb 2025
    console.log("End Date:", this.endDate); // Should be 2025-02-28 or 29 (for leap years)
  }
  
  

// Call this method only when filter is applied
applyFilter() {
  console.log('Applying filter:', {
    status: this.selectedStatus,
    startDate: this.startDate,
    endDate: this.endDate,
    employeeId: this.employeeId,
    employeeName: this.employeeName,
    projectId: this.projectId,
    projectName: this.projectName,
    timesheetPeriod: this.timesheetPeriod,
    workedHours: this.workedHours,
    leaveHours: this.leaveHours,
  });

  if (
    this.selectedStatus !== 'all' ||
    this.employeeName ||
    this.projectId ||
    this.projectName ||
    this.timesheetPeriod ||
    this.workedHours ||
    this.leaveHours
  ) {
    this.fetchFilteredEmployeeDetails(); // Fetch only if a filter is applied
  } else {
    this.employeeDetails = [...this.originalEmployeeDetails]; // Reset to full data
  }
}

  clearFields() {
    this.employeeId = '';
    this.employeeName = '';
    this.projectId = '';
    this.projectName = '';
    this.status = '';
    this.timesheetPeriod = '';
    this.workedHours = '';
    this.leaveHours = '';
    this.startDate = '';
    this.endDate = '';
    this.selectedStatus = 'all';
  }

  toggleStartDatePicker() {
    this.isStartPickerVisible = !this.isStartPickerVisible;
  }

  toggleEndDatePicker() {
    this.isEndPickerVisible = !this.isEndPickerVisible;
  }

  updateStartDate(event: any) {
    this.startDate = event.target.value;
  }

  updateEndDate(event: any) {
    this.endDate = event.target.value;
  }


   
  changeStatus(status: string) {
    this.selectedStatus = status;

    if (status === 'all') {
      this.employeeDetails = [...this.originalEmployeeDetails]; // Reset to full data
    } else if (status === 'approval') {
      this.employeeDetails = this.originalEmployeeDetails.filter(emp => emp.Timesheet_Status === 'Approved');
    } else if (status === 'reject') {
      this.employeeDetails = this.originalEmployeeDetails.filter(emp => emp.Timesheet_Status === 'Rejected');
    } else if (status === 'pending') {
      this.employeeDetails = this.originalEmployeeDetails.filter(emp => emp.Timesheet_Status === 'Pending');
    }
  }

  

  approveRequest(request: any) {
    console.log("Approving request for:", request);
    this.updateStatus(request, 'Approved');
    
  }
  
  rejectRequest(request: any) {
    console.log("Rejecting request for:", request);
    this.updateStatus(request, 'Rejected');
  }
  

// updateStatus(employee: any, status: string) {
//   const apiUrl = `http://localhost:2025/project/updateStatus/${employee.Employee_Id}`;
//   const requestBody = {
//     startDate: employee.Start_Date,
//     endDate: employee.End_Date,
//     status: status
//   };

//   console.log('🔹 API URL:', apiUrl);
//   console.log('📦 Request Body:', requestBody);

//   this.http.put(apiUrl, requestBody).subscribe(
//     (response: any) => {
//       console.log('✅ Success Response:', response);
//       this.showAlert('Success', `Request has been ${status.toLowerCase()} successfully.`);

//       // ✅ Update status in filtered list (employeeDetails)
//       const updatedEmployee = this.employeeDetails.find(emp => 
//         emp.Employee_Id === employee.Employee_Id &&
//         emp.Start_Date === employee.Start_Date &&
//         emp.End_Date === employee.End_Date
//       );

//       if (updatedEmployee) {
//         updatedEmployee.Timesheet_Status = status; // Update status in UI
//       }

//     },
//     (error) => {
//       console.error('❌ Error Response:', error);
//       this.showAlert('Error', 'Failed to update status.');
//     }
//   );
// }


 // 📢 Show Alert
 
 updateStatus(employee: any, status: string): void {
  const approverEmployeeId = localStorage.getItem('employeeId'); // Get logged-in user's ID
  if (!approverEmployeeId) {
      this.showAlert('Error', 'Unable to verify your identity. Please log in again.');
      return;
  }

  const apiUrl = `http://localhost:2025/project/updateStatus/${employee.Employee_Id}`;
  const requestBody = {
      startDate: employee.Start_Date,
      endDate: employee.End_Date,
      status: status,
      approverEmployeeId: approverEmployeeId
  };

  this.http.put<any>(apiUrl, requestBody).subscribe(
      (response) => {
          this.showAlert('Success', `Request has been ${status.toLowerCase()} successfully.`);
          
          // Update local data with Supervision_Date
          const index = this.employeeDetails.findIndex(emp => 
              emp.Employee_Id === employee.Employee_Id &&
              emp.Start_Date === employee.Start_Date &&
              emp.End_Date === employee.End_Date
          );
          
          if (index !== -1) {
              this.employeeDetails[index].Timesheet_Status = status;
              this.employeeDetails[index].Supervision = response.approver;
              this.employeeDetails[index].Supervision_Date = response.supervisionDate; // Update Supervision Date
          }
      },
      (error) => {
          console.error('Error:', error);
          this.showAlert('Error', 'Failed to update status.');
      }
  );
}
 async showAlert(header: string, message: string) {
  const alert = await this.alertController.create({
    header,
    message,
    buttons: ['OK']
  });
  await alert.present();
}
  


// 

fetchEmployeeDetails() {
  const employeeId = localStorage.getItem('employeeId'); // Ensure correct key usage

  if (!employeeId) {
    console.error('Employee_ID not found in localStorage');
    return;
  }

  this.http.get<any[]>(`http://localhost:2025/project/getEmployeeDetails/${employeeId}`).subscribe(
    (data) => {
      this.originalEmployeeDetails = data; // Store full data
      this.employeeDetails = [...this.originalEmployeeDetails]; // Copy data
      console.log('Employee Data:', this.employeeDetails);
    },
    (error) => {
      console.error('Error fetching employee details:', error);
    }
  );
}
  

// correctly fetching filtered employee details

fetchFilteredEmployeeDetails() {
  // Retrieve login details
  if (!this.loginEmployeeId) {
    this.loginEmployeeId = localStorage.getItem('employeeId')!;
  }
  if (!this.employeeRole) {
    this.employeeRole = localStorage.getItem('employeeRole')!; // Assuming role is stored in localStorage
  }

  console.log("Login Employee ID:", this.loginEmployeeId);
  console.log("Employee Role:", this.employeeRole);
  console.log("Filter Employee ID:", this.employeeId);
  console.log("Start Date:", this.startDate);
  console.log("End Date:", this.endDate);

  // Validate input fields
  if (!this.loginEmployeeId || !this.employeeId || !this.startDate || !this.endDate) {
    this.showAlert('Missing required fields', 'Please fill in all required fields.');
    return;
  }

  // **Users can only filter their own data**
  if (this.employeeRole === "User" && this.loginEmployeeId !== this.employeeId) {
    this.showAlert('Unauthorized', 'Users can only filter their own details.');
    return;
  }

  // **Admins cannot filter their own details**
  if (this.employeeRole === "admin" && this.loginEmployeeId === this.employeeId) {
    this.showAlert('Invalid Filter', 'Admins cannot filter their own details.');
    return;
  }

  const url = `http://localhost:2025/project/getFilteredEmployeeDetails/${this.loginEmployeeId}/${this.employeeId}/${this.startDate}/${this.endDate}`;

  this.http.get<any[]>(url).subscribe(
    (response) => {
      if (response && response.length > 0) {
        this.employeeDetails = response;
      } else {
        this.showAlert('No Records', 'No records found for the selected filters.');
        this.employeeDetails = [];
      }
    },
    (error) => {
      console.error('Error fetching filtered employee details:', error);
      this.showAlert('Error', 'Failed to fetch employee details. Please try again.');
    }
  );
}


////




// 🔹 Apply status filtering (works after both fetching functions)
filterByStatus(status: string) {
  this.selectedStatus = status;

  if (status === "all") {
    this.employeeDetails = [...this.originalEmployeeDetails]; // Show all
  } else {
    this.employeeDetails = this.originalEmployeeDetails.filter(
      emp => emp.Timesheet_Status.toLowerCase() === status
    );
  }

  console.log(`Filtered Employee Details (${status}):`, this.employeeDetails);
}


}



