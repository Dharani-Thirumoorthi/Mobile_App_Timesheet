import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { ActivatedRoute, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-sidebar',
  standalone: true, // This makes it a standalone component
  imports: [CommonModule, IonicModule],  // ✅ Import IonicModule
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  pageTitle: string = 'Dashboard'; // Default title
  employeeId: string | null = null; // No default value, will be set dynamically
  userProfile: any = null;
  profileImage: string | null = null;  // No image initially
  currentRoute: string = '/dashboard'; 

  pageTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/timesheet-entry': 'Timesheet Entry',
    '/calendar': 'Calendar',
    '/timesheet-report': 'Timesheet Report',
    '/expense-sheet': 'Expense Sheet',
    '/admin': 'Admin'
  };
  constructor(
    private router: Router,
    public menuCtrl: MenuController,  // Change 'private' to 'public'
    private alertController: AlertController,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.pageTitle = this.pageTitles[event.url] || 'Timesheet';
        this.currentRoute = event.url; // Update the active route
        console.log("Current Route:", this.currentRoute);
      }
    });
    this.loadEmployeeId();
    this.loadProfileImage(); // Load profile image when the component initializes
    
  }

  navigateToDashboard() {
    this.menuCtrl.close();
    this.router.navigate(['/dashboard']);
  }

  navigateToTimesheetEntry() {
    this.menuCtrl.close();
    this.router.navigate(['/timesheet-entry']);
  }

  navigateToTimesheetReport() {
    this.menuCtrl.close();
    this.router.navigate(['/timesheet-report']);
  }

  navigateToCalendar() {
    this.menuCtrl.close();
    this.router.navigate(['/calendar']);
  }


  loadProfileImage() {
    if (!this.employeeId) {
        console.warn("Employee ID not found. Unable to load profile image.");
        return;
    }

    this.http.get(`http://localhost:2025/user/user-profile/${this.employeeId}`).subscribe(
        (response: any) => {
            if (response.Profile_Image) {
                this.profileImage = `http://localhost:2025${response.Profile_Image}`;
                console.log("Profile image loaded successfully:", this.profileImage);
            } else {
                console.warn("No profile image found in response.");
            }
        },
        (error) => {
            console.error("Error fetching profile image:", error);
        }
    );
}


  loadEmployeeId() {
    this.employeeId = localStorage.getItem('employeeId'); // Example: Fetch from local storage
    if (!this.employeeId) {
      console.warn('Employee ID not found!');
    }
  }
  
  
  openUserProfile() {
    if (!this.employeeId) {
        this.showErrorAlert('Employee ID is missing! Please log in again.');
        return;
    }

    this.http.get(`http://localhost:2025/user/user-profile/${this.employeeId}`).subscribe(
        (response: any) => {
            this.userProfile = response;
            
            console.log("API Response:", response); // Debugging: Check what API returns
            
            if (response.Profile_Image) {
                this.profileImage = `http://localhost:2025${response.Profile_Image}`;
            } else {
                console.warn("Profile image not found in API response!");
            }

            this.menuCtrl.open('profile-menu');
        },
        (error) => {
            console.error('Error fetching user profile:', error);
            this.showErrorAlert('Unable to fetch user details. Please try again.');
        }
    );
}
  
 
  
  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }



  // ------------------------------------------------------------
  // Additional Alerts
  // ------------------------------------------------------------
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
  navigateToUserProfile() {
    this.router.navigate(['/user-profile'], { queryParams: { employeeId: this.employeeId } });
  }
  
  uploadImage() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files[0]) {
      const file = input.files[0]; // Get the selected file
      const formData = new FormData(); // Create FormData object
  
      formData.append("profile_image", file); // Append file to FormData
  
      // Show image preview (Optional)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result; // Set preview
      };
      reader.readAsDataURL(file);
  
      // Send file to backend
      this.uploadProfileImage(formData);
    }
  }
  
 
  uploadProfileImage(formData: FormData) {
    if (!this.employeeId) {
      console.error("Employee ID is missing!");
      return;
    }
  
    formData.append("employeeId", this.employeeId);
  
    this.http.post('http://localhost:2025/user/upload', formData).subscribe(
      (response: any) => {
        console.log("File uploaded successfully!", response);
        
        if (response.path) {
          this.profileImage = `http://localhost:2025${response.path}`;
        } else {
          console.warn("Image upload succeeded, but no path returned.");
        }
      },
      (error) => {
        console.error("File upload failed!", error);
      }
    );
  }
  
  

}

