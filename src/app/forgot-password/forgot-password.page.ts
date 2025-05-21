import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {

  email: string = '';

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  resetPassword() {
    if (!this.email) {
      this.presentToast('Please enter your email', 'warning');
      return;
    }

    const resetData = { Email: this.email };  // ✅ Ensure it matches backend API

    this.http.post('http://localhost:2025/user/forgot-password', resetData).subscribe(
      () => {
        this.presentToast('Reset link sent to your email!', 'success');
        //this.router.navigate(['/reset-password']);
      },
      (error) => {
        this.presentToast(error.error?.message || 'Failed to send reset link. Try again!', 'danger');
      }
    );
  }
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
