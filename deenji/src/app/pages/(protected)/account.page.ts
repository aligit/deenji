// src/app/pages/(protected)/account.page.ts
import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { authGuard } from '../../core/guards/auth.guard';
import { Session } from '@supabase/supabase-js';

// Import Spartan UI components
import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/helm/tabs';

// Import your components
import { ProfileInfoComponent } from './components/profile-info.component';
import { AccountSettingsComponent } from './components/account-settings.component';
import { PropertiesComponent } from './components/properties.component';

export const routeMeta: RouteMeta = {
  title: 'حساب کاربری',
  canActivate: [authGuard],
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Spartan UI Tab components
    HlmTabsComponent,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
    HlmTabsContentDirective,
    // Our tab components
    ProfileInfoComponent,
    AccountSettingsComponent,
    PropertiesComponent,
  ],
  template: `
    <div class="container mx-auto px-4 py-12 min-h-[calc(100vh-16rem)]">
      @if(session){
      <div class="max-w-5xl mx-auto">
        <!-- Profile header with avatar -->
        <div
          class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8"
        >
          <div class="relative">
            <div
              class="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-4 border-primary-500"
            >
              @if(profileImage){
              <img
                [src]="profileImage"
                alt="Profile"
                class="w-full h-full object-cover"
              />
              }@else{
              <span class="text-3xl font-semibold text-primary-600">
                {{ getInitials() }}
              </span>
              }
            </div>
            <button
              class="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1.5 text-white hover:bg-primary-700 transition-colors"
              (click)="openImageUpload()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <input
              type="file"
              #fileInput
              hidden
              accept="image/*"
              (change)="uploadAvatar($event)"
            />
          </div>

          <div class="text-center md:text-right md:flex-1">
            <h1 class="text-2xl font-bold">{{ username || 'کاربر دینجی' }}</h1>
            <p class="text-gray-600">
              {{ session && session.user ? session.user.email : '' }}
            </p>

            @if (website) {
            <a
              [href]="website"
              target="_blank"
              class="text-primary-600 hover:text-primary-700 inline-flex items-center mt-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="ml-1"
              >
                <path
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                ></path>
                <path
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                ></path>
              </svg>
              {{ website }}
            </a>
            }
          </div>
        </div>

        <!-- Spartan UI Tabs Implementation -->
        <hlm-tabs
          tab="{{ activeTab }}"
          class="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8"
          orientation="vertical"
        >
          <!-- Tab Contents -->
          <div class="flex-1 w-full">
            <!-- Profile Information Tab -->
            <div hlmTabsContent="profile">
              <app-profile-info
                [session]="session"
                [loading]="loading"
                [username]="username"
                [website]="website"
                (profileUpdated)="handleProfileUpdated($event)"
              ></app-profile-info>
            </div>

            <!-- Account Settings Tab -->
            <div hlmTabsContent="account">
              <app-account-settings
                [session]="session"
                [loading]="loading"
                (signOutRequested)="signOut()"
              ></app-account-settings>
            </div>

            <!-- Saved Properties Tab -->
            <div hlmTabsContent="saved">
              <app-properties [session]="session"></app-properties>
            </div>
          </div>

          <!-- Tab List -->
          <hlm-tabs-list
            orientation="vertical"
            aria-label="Account Settings"
            class="w-full md:w-64"
          >
            <button
              hlmTabsTrigger="profile"
              class="w-full text-right"
              (click)="activeTab = 'profile'"
            >
              اطلاعات شخصی
            </button>
            <button
              hlmTabsTrigger="account"
              class="w-full text-right"
              (click)="activeTab = 'account'"
            >
              تنظیمات حساب
            </button>
            <button
              hlmTabsTrigger="saved"
              class="w-full text-right"
              (click)="activeTab = 'saved'"
            >
              املاک ذخیره شده
            </button>
          </hlm-tabs-list>
        </hlm-tabs>
      </div>
      } @else {
      <div class="flex flex-col items-center justify-center h-64">
        <p class="mb-4 text-lg">
          لطفاً برای دسترسی به حساب کاربری خود وارد شوید.
        </p>
        <a
          [routerLink]="['/login']"
          class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          ورود
        </a>
      </div>
      }
    </div>
  `,
})
export default class AccountPageComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  // User data
  loading = false;
  session: Session | null = null;
  username = '';
  website = '';
  profileImage: string | null = null;

  // Tab state
  activeTab = 'profile';

  async ngOnInit() {
    await this.loadSession();
  }

  async loadSession() {
    try {
      // First check if we already have a session in the service
      if (this.supabase.session) {
        console.log('Using existing session from SupabaseService');
        this.session = this.supabase.session;
        if (this.session) {
          await this.loadProfile();
        }
        return;
      }

      console.log('Fetching session from Supabase');
      const { data } = await this.supabase.getSession();
      this.session = data.session;

      if (this.session) {
        await this.loadProfile();
      } else {
        console.log('No active session found');
      }

      // Set up auth state change listener
      this.supabase.onAuthStateChange((event, session) => {
        console.log(
          'Auth state changed in account page:',
          event,
          session ? 'Authenticated' : 'Not authenticated'
        );
        this.session = session;
        if (session) {
          this.loadProfile();
        }
      });
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  async loadProfile() {
    if (!this.session?.user) {
      console.log('Cannot load profile: No authenticated user');
      return;
    }

    try {
      this.loading = true;
      console.log('Loading profile for user:', this.session.user.id);

      const { data, error } = await this.supabase.profile(this.session.user);

      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }

      if (data) {
        console.log('Profile data loaded:', data);
        this.username = data.username || '';
        this.website = data.website || '';

        // Load avatar if available
        if (data.avatar_url) {
          // In a real app, would construct proper URL or fetch the image
          this.profileImage = data.avatar_url;
        }
      } else {
        console.log('No profile data found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      this.loading = false;
    }
  }

  getInitials(): string {
    if (this.username) {
      return this.username
        .split(' ')
        .map((name) => name.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }
    if (this.session && this.session.user && this.session.user.email) {
      return this.session.user.email.charAt(0).toUpperCase();
    }
    return '?';
  }

  openImageUpload() {
    this.fileInput.nativeElement.click();
  }

  async uploadAvatar(event: any) {
    if (!this.session?.user) return;

    const file = event.target.files[0];
    if (!file) return;

    try {
      this.loading = true;

      // In a real app, would upload to storage and get URL
      console.log('Would upload file:', file.name);

      // For now, just log that we would upload
      console.log('File selected for upload:', file);

      // Update profile with new avatar URL (would be actual URL in real app)
      /*
      await this.supabase.updateProfile({
        id: this.session.user.id,
        avatar_url: 'https://example.com/avatar.jpg' // placeholder
      });
      */
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      this.loading = false;
    }
  }

  handleProfileUpdated(profileData: any) {
    console.log('Profile updated:', profileData);
    this.username = profileData.username || '';
    this.website = profileData.website || '';
  }

  async signOut() {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
