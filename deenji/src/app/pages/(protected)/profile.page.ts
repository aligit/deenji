// src/app/pages/(protected)/profile.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { authGuard } from '../../core/guards/auth.guard';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const routeMeta: RouteMeta = {
  title: 'حساب کاربری',
  canActivate: [authGuard],
};

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-12 min-h-[calc(100vh-16rem)]">
      @if(session){
      <h1 class="text-2xl font-bold mb-8 text-center">حساب کاربری</h1>
      <form
        [formGroup]="updateProfileForm"
        (ngSubmit)="updateProfile()"
        class="max-w-md mx-auto"
      >
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Email</label
          >
          <input
            id="email"
            type="text"
            [value]="session ? session.user.email : ''"
            disabled
            class="w-full p-2 mb-2 border border-gray-300 rounded"
          />
        </div>
        <div class="mt-4">
          <label
            for="username"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Name</label
          >
          <input
            formControlName="username"
            id="username"
            type="text"
            class="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="mt-4">
          <label
            for="website"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Website</label
          >
          <input
            formControlName="website"
            id="website"
            type="url"
            class="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="mt-6">
          <button
            type="submit"
            class="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
            [disabled]="loading"
          >
            {{ loading ? 'Loading ...' : 'Update' }}
          </button>
        </div>
        <div class="mt-4">
          <button
            (click)="signOut()"
            type="button"
            class="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </form>
      } @else {
      <div class="flex flex-col items-center justify-center h-64">
        <p class="mb-4 text-lg">Please sign in to access your profile.</p>
        <a
          [routerLink]="['/login']"
          class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Log in
        </a>
      </div>
      }
    </div>
  `,
})
export default class ProfilePageComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  loading = false;
  session: Session | null = null;

  updateProfileForm = this.formBuilder.group({
    username: [''],
    website: [''],
    avatar_url: [''],
  });

  constructor() {
    this.loadSession();
  }

  async loadSession() {
    const { data } = await this.supabase.getSession();
    this.session = data.session;

    this.supabase.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session);
        this.session = session;
        if (session) this.loadProfile();
      }
    );

    if (this.session) this.loadProfile();
  }

  async loadProfile() {
    if (!this.session) return;
    console.log('Profile loading for user:', this.session.user.id);
    // Add additional profile loading logic here if needed, e.g., fetching from a profiles table
  }

  async updateProfile(): Promise<void> {
    if (!this.session) return;

    try {
      this.loading = true;
      const { user } = this.session;
      const { username, website, avatar_url } = this.updateProfileForm.value;
      const { error } = await this.supabase.updateProfile({
        id: user.id,
        username: username || '',
        website: website || '',
        avatar_url: avatar_url || '',
      });
      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      this.loading = false;
    }
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
