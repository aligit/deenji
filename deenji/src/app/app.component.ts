import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/footer.component';
import { NavbarComponent } from './shared/navbar.component';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'deenji-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  template: `
    <div class="flex flex-col min-h-screen">
      <!-- Standard navbar for non-home pages -->
      <app-navbar
        *ngIf="!isHomePage"
        class="fixed top-0 left-0 right-0 w-full z-50"
      />

      <!-- Content area with proper padding based on current route -->
      <div class="flex-1" [ngClass]="{ 'pt-16': !isHomePage }">
        <router-outlet></router-outlet>
      </div>

      <app-footer />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-height: 100vh;
      }

      .standard-navbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 50;
      }
    `,
  ],
})
export class AppComponent {
  isHomePage = false;
  private router = inject(Router);

  ngOnInit() {
    // Check initial route
    this.checkIfHomePage(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkIfHomePage(event.urlAfterRedirects);
      });
  }

  private checkIfHomePage(url: string): void {
    // For AnalogJS routing, home page is typically '/' or '/home'
    this.isHomePage = url === '/' || url === '/home';
  }
}
