import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage {
  employeeId: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  // Show toast message
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  // Handle login
  login() {
    if (!this.employeeId || !this.password) {
      this.presentToast('Employee ID and Password are required', 'warning');
      return;
    }

    const loginData = {
      Employee_ID: this.employeeId,
      Password: this.password
    };

    // Post request to backend for login
    this.http.post('http://localhost:2025/user/login', loginData).subscribe(
      (response: any) => {
        this.presentToast('Login successful!', 'success');
        localStorage.setItem('employeeId', this.employeeId); // Store employeeId in localStorage
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        if (error.status === 404) {
          this.presentToast('User not found', 'warning');
        } else if (error.status === 401) {
          this.presentToast('Invalid password', 'danger');
        } else {
          this.presentToast('Login failed. Try again!', 'danger');
        }
      }
    );
  }

  // Navigate to Register page
  navigateToRegister() {
    this.router.navigate(['/register']);
  }
 navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']); 
 }

  // Show contact us alert
  async showContactUsAlert() {
    const alert = await this.alertController.create({
      header: 'Contact Us',
      message: `Email: timesheetsupport@shoubii.net
      Phone: +1 234 567 890`,
      buttons: ['Close'],
      cssClass: 'custom-alert',
    });

    await alert.present();
  }
}