import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  styles: [`
    .scheduler-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    }

    .scheduler-popup-card {
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem 3rem;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .popup-icon {
      font-size: 3rem;
      color: #4a90e2; /* Modern blue */
      margin-bottom: 0.5rem;
      animation: bounce 1s infinite;
    }

    .popup-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
    }

    .popup-subtitle {
      font-size: 1rem;
      color: #666;
      margin: 0;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { 
      0% { opacity: 0; transform: scale(0.8) translateY(20px); } 
      100% { opacity: 1; transform: scale(1) translateY(0); } 
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `],
  template: `
    <div class="scheduler-popup-overlay" *ngIf="showSchedulerNotification">
      <div class="scheduler-popup-card">
        <span class="material-icons popup-icon">schedule_send</span>
        <h2 class="popup-title">Scheduler Active</h2>
        <p class="popup-subtitle">Fetching Emails Mon-Fri @ 12:00 PM</p>
      </div>
    </div>
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `
})
export class AppComponent implements OnInit {
  showSchedulerNotification = true;

  ngOnInit() {
    // Show notification for 1.5 seconds on app load
    setTimeout(() => {
      this.showSchedulerNotification = false;
    }, 1500);
  }
}
