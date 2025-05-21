import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  resetToken: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    // Extract token from URL
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['resetToken']; // Correctly extracts token
    });
  }

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
    if (this.newPassword !== this.confirmPassword) {
      this.presentToast('Passwords do not match!', 'danger');
      return;
    }

    const data = { Password: this.newPassword };

    // Send request to backend with token
    this.http.post(`http://localhost:2025/user/user/reset-password/${this.resetToken}`, data).subscribe(
      () => {
        this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/signin']); // Redirect to login page
      },
      (error) => {
        this.presentToast('Error resetting password!', 'danger');
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
