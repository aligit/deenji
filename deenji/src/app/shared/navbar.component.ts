import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../core/services/supabase.service';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    AngularSvgIconModule,
    HlmButtonDirective,
    RouterModule,
  ],
  template: `
    <header class="bg-secondary-900 bg-opacity-90 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative flex items-center h-16">
          <div class="flex flex-1 items-center">
            <div class="hidden md:flex items-center space-x-6">
              <a
                [routerLink]="['/buy']"
                class="text-primary-100 hover:text-primary-300 text-sm font-medium rtl:ml-6 ltr:mr-6"
              >
                خرید
              </a>
              <a
                [routerLink]="['/sell']"
                class="text-primary-100 hover:text-primary-300 text-sm font-medium"
              >
                فروش
              </a>
            </div>
          </div>
          <div
            class="absolute inset-x-0 flex justify-center items-center pointer-events-none"
          >
            <a
              [routerLink]="['/']"
              class="text-2xl font-semibold pointer-events-auto"
            >
              <svg-icon
                src="/images/deenji.svg"
                [svgStyle]="{ 'width.px': 90, fill: 'white' }"
              ></svg-icon>
            </a>
          </div>
          <div class="flex flex-1 justify-end items-center">
            <div class="hidden md:flex items-center space-x-6">
              <button
                *ngIf="!sessionSignal()"
                [routerLink]="['/login']"
                hlmBtn
                class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                ورود / ثبت نام
              </button>
              <a
                *ngIf="sessionSignal()"
                [routerLink]="['/profile']"
                class="text-primary-100 hover:text-primary-300 text-sm font-medium"
              >
                حساب کاربری
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
})
export class NavbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);

  public isHomePage = signal(false);
  public sessionSignal = signal<Session | null>(null);
  private routerSubscription: Subscription | null = null;

  constructor() {
    this.loadSession();
  }

  async loadSession() {
    // Get initial session
    const { data } = await this.supabase.getSession();
    this.sessionSignal.set(data.session);

    // Set up auth state change listener
    this.supabase.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session);
        this.sessionSignal.set(session);
      }
    );
  }

  ngOnInit() {
    this.checkIfHomePage(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIfHomePage(event.urlAfterRedirects);
      });
  }

  private checkIfHomePage(url: string): void {
    this.isHomePage.set(url === '/' || url === '/home');
  }
}
