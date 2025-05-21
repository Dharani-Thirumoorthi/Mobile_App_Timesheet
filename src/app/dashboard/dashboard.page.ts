import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { StatusBar, StatusBarStyle } from '@capacitor/status-bar';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { MenuController } from '@ionic/angular';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  total_worked_hrs: number = 0;
  total_worked_days: number = 0;
  pending_approvals: number = 0;
  total_leave_hrs: number = 0;
  total_approved: number = 0;
  total_pending: number = 0;
  total_rejected: number = 0;
  employeeId: number | null = null;
  employeeRole: string = '';
  usageChart: any;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private http: HttpClient,
    private menuCtrl: MenuController
  ) {
    this.configureStatusBar();
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'first');
  }

  async configureStatusBar() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDarkMode) {
      await StatusBar.setBackgroundColor({ color: '#131313' });
      await StatusBar.setStyle({ style: StatusBarStyle.Dark });
    } else {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      await StatusBar.setStyle({ style: StatusBarStyle.Light });
    }
  }

  ngOnInit() {
    this.getEmployeeId();
    this.getTimesheetStatusCounts(); // Fetch timesheet counts
  }

  getEmployeeId() {
    const storedEmployeeId = localStorage.getItem('employeeId');
    if (storedEmployeeId) {
      this.employeeId = parseInt(storedEmployeeId, 10);
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
            this.getEmployeeSummary(); // Fetch summary after role is determined
          } else {
            console.error('Employee role not found');
          }
        },
        (error) => {
          console.error('Error fetching employee role:', error);
        }
      );
  }

  getEmployeeSummary() {
    if (!this.employeeId) return;

    this.http
      .get<any>(`http://localhost:2025/project/getEmployeeSummary/${this.employeeId}`)
      .subscribe(
        (response) => {
          console.log('API Response:', response);
          if (response) {
            this.total_worked_hrs = response.total_worked_hrs || 0;
            this.total_worked_days = response.total_worked_days || 0;
            this.total_leave_hrs = response.total_leave_hrs || 0;
            this.pending_approvals = response.pending_approvals || 0;

            // Show charts based on employee role
            if (this.employeeRole.toLowerCase() === 'admin') {
              this.getTimesheetStatusCounts(); // Load Timesheet Chart only for admin
            } else {
              this.loadUsageChart(); // Load Usage Chart only for regular users
            }
          }
        },
        (error) => {
          console.error('Error fetching employee summary:', error);
        }
      );
}

      loadUsageChart() {
        Chart.register(...registerables, ChartDataLabels);
    
        const ctx = document.getElementById('usageChart') as HTMLCanvasElement;
        if (!ctx) return;
    
        if (this.usageChart) {
          this.usageChart.destroy();
        }
    
        this.usageChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Worked Days', 'Leave Hours', 'Pending Approvals'],
            datasets: [
              {
                data: [this.total_worked_days, this.total_leave_hrs, this.pending_approvals],
                backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
                borderWidth: 2,
                offset: [30, 0, 10],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
          },
        });
      }
    
     
      getTimesheetStatusCounts() {
        this.http
          .get<any>('http://localhost:2025/project/getTimesheetStatusCounts')
          .subscribe(
            (response) => {
              console.log('Timesheet Status Counts:', response);
              if (response) {
                this.total_approved = response.total_approved || 0;
                this.total_pending = response.total_pending || 0;
                this.total_rejected = response.total_rejected || 0;

                this.loadTimesheetChart(); // Load new chart
              }
            },
            (error) => {
              console.error('Error fetching timesheet status counts:', error);
            }
          );
      }
      loadTimesheetChart() {
        Chart.register(...registerables, ChartDataLabels);
      
        const ctx = document.getElementById('timesheetChart') as HTMLCanvasElement;
        if (!ctx) return;
      
        if (this.usageChart) {
          this.usageChart.destroy();
        }
      
        this.usageChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [
              {
                data: [this.total_approved, this.total_rejected, this.total_pending],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107'], // Green, Red, Yellow
                borderWidth: 2,
                offset: [10, 10, 10],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
          },
        });
      }
      
    }      