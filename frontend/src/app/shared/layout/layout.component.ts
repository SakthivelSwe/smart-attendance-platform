import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <!-- Sidebar -->
      <app-sidebar
        [isCollapsed]="sidebarCollapsed"
        [isMobileOpen]="mobileMenuOpen"
        (toggleCollapse)="sidebarCollapsed = !sidebarCollapsed"
        (closeMobile)="mobileMenuOpen = false"
      ></app-sidebar>

      <!-- Mobile overlay -->
      <div
        *ngIf="mobileMenuOpen"
        class="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
        (click)="mobileMenuOpen = false"
      ></div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-spring"
           [class.lg:ml-72]="!sidebarCollapsed"
           [class.lg:ml-20]="sidebarCollapsed">
        <app-header
          (toggleMobileMenu)="mobileMenuOpen = !mobileMenuOpen"
        ></app-header>

        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <!-- Subtle background mesh -->
          <div class="absolute inset-0 bg-gradient-mesh dark:bg-gradient-mesh-dark pointer-events-none"></div>
          <div class="max-w-7xl mx-auto relative animate-fade-in">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
}
