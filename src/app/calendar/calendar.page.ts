import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { MenuController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  events: { title: string; time: string; date: string }[] = [];
  newEventTitle: string = '';
  newEventTime: string = '';
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = []; // Array to store highlighted dates

  // Object to store events dynamically
  eventList: { [date: string]: { title: string; time: string; date: string }[] } = {};
  markedDates: string[] = []; // Array to store event dates for highlighting
  timeOptions: string[] = [];
  eventColors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8']; // Different border-left colors
  selectedEventIndex: number | null = null; // To store selected event index
  employeeRole: string = ''; // Store the role
  employeeId: number | null = null;
  visibleEvents: { [date: string]: boolean } = {};
  viewAll: boolean = false;
  constructor(
    private router: Router,
    private alertController: AlertController,
    private menuCtrl: MenuController,
    private http: HttpClient
  ) {
    this.loadEvents();
    this.initializeTimeOptions();
    
  }

  ngOnInit() {
    this.getEmployeeId();
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
            console.log('Employee role:', this.employeeRole);
          } else {
            console.error('Employee role not found');
          }
        },
        (error) => {
          console.error('Error fetching employee role:', error);
        }
      );
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'first');
    this.loadEventsFromDatabase();
  }

  onDateChange(event: any) {
    this.viewAll = false; // Reset to date-specific view
    const selectedDate = event.detail.value.split('T')[0];
    this.selectedDate = selectedDate;
    this.loadEvents();
  }

  loadEvents(initialLoad: boolean = false) {
    if (this.viewAll) {
      this.showAllEvents();
      return;
    }
  
    const dateKey = this.selectedDate;
    this.events = this.eventList[dateKey] ? [...this.eventList[dateKey]] : [];
  
    if (this.events.length === 0) {
      this.events.push({ title: 'No events', time: '', date: '' });
    }
  
    console.log('Events:', this.events);
  }

  addEvent() {
    if (!this.newEventTitle || !this.newEventTime) {
      return;
    }

    const dateKey = this.selectedDate.split('T')[0];

    if (!this.eventList[dateKey]) {
      this.eventList[dateKey] = [];
    }

    this.eventList[dateKey].push({
      title: this.newEventTitle,
      time: this.newEventTime,
      date: this.selectedDate,
    });

    this.newEventTitle = '';
    this.newEventTime = '';

    this.loadEvents(); // Refresh event list
  }

  initializeTimeOptions() {
    const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
    const minutes = ['00', '15', '30', '45'];
    const periods = ['AM', 'PM'];

    // Generate time options in AM/PM format
    for (let hour of hours) {
      for (let minute of minutes) {
        for (let period of periods) {
          this.timeOptions.push(`${hour}:${minute} ${period}`);
        }
      }
    }
  }

  async presentAddEventAlert() {
    const alert = await this.alertController.create({
      header: 'Add Event',
      inputs: [
        {
          name: 'eventName',
          type: 'text',
          placeholder: 'Event Name',
        },
        {
          name: 'eventDate',
          type: 'date',
          placeholder: 'Event Date',
        },
        {
          name: 'eventType',
          type: 'text',
          placeholder: 'Event Type',
        },
        {
          name: 'eventEveryYear',
          type: 'checkbox',
          label: 'Every Year',
          value: 'everyYear',
          checked: false,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Add event cancelled');
          },
        },
        {
          text: 'Add',
          handler: (data) => {
            console.log('Event Data:', data);
            this.addEventToDatabase(data);
          },
        },
      ],
    });
    await alert.present();
  }

  addEventToDatabase(eventData: any) {
    const eventPayload = {
      Event_Name: eventData.eventName,
      Event_Date: eventData.eventDate,
      Event_Type: eventData.eventType,
      Event_EveryYear: eventData.eventEveryYear ? 1 : 0, // Convert checkbox value to 1 or 0
    };

    fetch('http://localhost:2025/calendar/insertEvent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data);
        alert('Event added successfully!');

        // Reload events from database after adding a new event
        this.loadEventsFromDatabase();
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Error adding event.');
      });
  }

  
  loadEventsFromDatabase() {
    const url = 'http://localhost:2025/calendar/getEvents?cache=' + new Date().getTime();
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.events) {
          this.eventList = {};
          this.highlightedDates = [];

          data.events.forEach((event: any) => {
            const dateKey = event.Event_Date.split('T')[0];

            if (!this.eventList[dateKey]) {
              this.eventList[dateKey] = [];
            }
            this.eventList[dateKey].push({
              title: event.Event_Name,
              time: event.Event_Type,
              date: event.Event_Date,
            });

            this.highlightedDates.push({
              date: dateKey,
              textColor: '#000',
              backgroundColor: '#ffcc00',
            });
          });

          console.log('Event List:', this.eventList);
          this.loadEvents(true); // Load all events initially
        }
      })
      .catch((error) => console.error('Error fetching events:', error));
  }

  async editEvent(event: any, index: number) {
    const alert = await this.alertController.create({
      header: 'Edit Event',
      inputs: [
        {
          name: 'eventName',
          type: 'text',
          placeholder: 'Event Name',
          value: event.title, // Pre-fill with current event title
        },
        {
          name: 'eventDate',
          type: 'date',
          placeholder: 'Event Date',
          value: event.date, // Pre-fill with current event date
        },
        {
          name: 'eventType',
          type: 'text',
          placeholder: 'Event Type',
          value: event.time, // Pre-fill with current event type
        },
        {
          name: 'eventEveryYear',
          type: 'checkbox',
          label: 'Every Year',
          value: 'everyYear',
          checked: event.everyYear || false, // Pre-fill with current event everyYear value
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            this.updateEvent(event, data); // Call the update method when save is clicked
          },
        },
      ],
    });
    await alert.present();
  }

  updateEvent(event: any, updatedData: any) {
    const updatedEvent = {
      Event_Name: updatedData.eventName,
      Event_Date: updatedData.eventDate,
      Event_Type: updatedData.eventType,
      Event_EveryYear: updatedData.eventEveryYear ? 1 : 0, // Convert checkbox value to 1 or 0
    };

    const eventName = encodeURIComponent(event.title); // The event title is passed in URL, so encode it
    this.http
      .patch(`http://localhost:2025/calendar/updateEvent/${eventName}`, updatedEvent)
      .subscribe(
        async (response) => {
          console.log('Event updated successfully:', response);
          this.loadEventsFromDatabase(); // Reload events after successful update

          // Show success alert
          const successAlert = await this.alertController.create({
            header: 'Success',
            message: 'Event updated successfully!',
            buttons: ['OK']
          });
          await successAlert.present();
        },
        async (error) => {
          console.error('Error updating event:', error);
          const errorAlert = await this.alertController.create({
            header: 'Error',
            message: 'Error updating event.',
            buttons: ['OK']
          });
          await errorAlert.present();
        }
      );
  }

  saveUpdatedEventToDatabase(event: any) {
    fetch('http://localhost:2025/calendar/updateEvent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Event_Name: event.title,
        Event_Time: event.time,
        Event_Date: event.date,
      }),
    })
      .then((response) => response.json())
      .then(() => alert('Event updated successfully!'))
      .catch((error) => console.error('Error updating event:', error));
  }

  selectEvent(index: number) {
    this.selectedEventIndex = index;

    setTimeout(() => {
      const eventElement = document.getElementById(`event-${index}`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Apply a highlight effect
        eventElement.classList.add('highlighted');

        // Remove highlight after a few seconds
        setTimeout(() => {
          eventElement.classList.remove('highlighted');
        }, 2000);
      }
    }, 100);
  }

 
    async deleteEvent(event: any, index: number) {
    console.log('🟢 Deleting Event:', event);
  
    if (!event || !event.title) {
      console.error('❌ Invalid event name: Missing name');
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Invalid event name. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
  
    // Show confirmation dialog
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the event: "${event.title}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('❌ Event deletion canceled by user.');
          },
        },
        {
          text: 'Delete',
          handler: () => {
            const eventName = encodeURIComponent(event.title); // Encode URL if event name has spaces
            console.log('🟢 Event Name to delete:', eventName);
  
            this.http.delete(`http://localhost:2025/calendar/deleteEvent/${eventName}`).subscribe(
              async (response: any) => {
                console.log('✅ Event deleted:', response);
                this.events.splice(index, 1); // Remove from UI
                const successAlert = await this.alertController.create({
                  header: 'Success',
                  message: `Event "${event.title}" deleted successfully!`,
                  buttons: ['OK']
                });
                await successAlert.present();
              },
              async (error) => {
                console.error('❌ Error deleting event:', error);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: `Error: ${error.error.message}`,
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            );
          },
        },
      ],
    });
  
    await alert.present();
  }

  showAllEvents() {
    this.viewAll = true; // Enable viewing all events
    this.events = []; // Clear current events list
    Object.keys(this.eventList).forEach((dateKey) => {
      this.eventList[dateKey].forEach((event) => {
        this.events.push({ title: event.title, time: event.time, date: event.date });
      });
    });
  
    if (this.events.length === 0) {
      this.events.push({ title: 'No events found', time: '', date: '' });
    }
  
    console.log('All Events:', this.events);
  }
  
}