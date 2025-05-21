import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//below added
import { TimesheetEntryPage } from './timesheet-entry/timesheet-entry.page';
import { DashboardPage } from './dashboard/dashboard.page';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  
  {
    path: 'signin',
    loadComponent: () => import('./signin/signin.page').then( m => m.SigninPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  
 

  {
    path: 'timesheet-entry',
    loadComponent: () => import('./timesheet-entry/timesheet-entry.page').then( m => m.TimesheetEntryPage)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar.page').then( m => m.CalendarPage)
  },
  {
    path: 'timesheet-report',
    loadComponent: () => import('./timesheet-report/timesheet-report.page').then( m => m.TimesheetReportPage)
  },
  {
    path: 'leave-requests',
    loadComponent: () => import('./leave-requests/leave-requests.page').then( m => m.LeaveRequestsPage)
  },
 
  
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  
  {
    path: 'first',
    loadComponent: () => import('./first/first.page').then( m => m.FirstPage)
  },

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
