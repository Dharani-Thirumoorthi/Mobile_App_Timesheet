import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  employeeId: string = '';
  employeeName: string = '';
  email: string = '';
  mobileNumber: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController
  ) {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  validateInput(): boolean {
    if (!this.employeeId || !this.employeeName || !this.email || !this.mobileNumber || !this.password || !this.confirmPassword) {
      this.presentToast('All fields are required', 'warning');
      return false;
    }

    if (!/^\d+$/.test(this.employeeId)) {
      this.presentToast('Employee ID must contain only numbers', 'danger');
      return false;
    }

    if (!/^\d{10}$/.test(this.mobileNumber)) {
      this.presentToast('Mobile Number must be 10 digits', 'danger');
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.presentToast('Passwords do not match', 'danger');
      return false;
    }

    return true;
  }

  signUp() {
    if (!this.validateInput()) {
      return;
    }

    const userData = {
      Employee_ID: this.employeeId,
      Employee_Name: this.employeeName,
      Email: this.email,
      Mobile_Number: this.mobileNumber,
      Password: this.password,
    };

    this.http.post('http://localhost:2025/user/signup', userData).subscribe(
      (response: any) => {
        this.presentToast('Registration successful!', 'success');
        this.router.navigate(['/signin']);
      },
      (error) => {
        if (error.status === 409) {
          this.presentToast('Account already exists', 'warning');
        } else {
          this.presentToast('Registration failed. Try again!', 'danger');
        }
      }
    );
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      console.log('Password field toggled:', this.showPassword);
    } else if (field === 'confirmPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
      console.log('Confirm Password field toggled:', this.showConfirmPassword);
    }
  }

  navigateToSignIn() {
    this.router.navigate(['/signin']);
  }
}