import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Added RouterModule for routerLink
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], // Added RouterModule
  template: `
    <div *ngIf="session; else noSession">
      <form
        [formGroup]="updateProfileForm"
        (ngSubmit)="updateProfile()"
        class="form-widget"
      >
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            type="text"
            [value]="session ? session.user.email : ''"
            disabled
            class="inputField"
          />
        </div>
        <div>
          <label for="username">Name</label>
          <input
            formControlName="username"
            id="username"
            type="text"
            class="inputField"
          />
        </div>
        <div>
          <label for="website">Website</label>
          <input
            formControlName="website"
            id="website"
            type="url"
            class="inputField"
          />
        </div>
        <div>
          <button
            type="submit"
            class="button primary block"
            [disabled]="loading"
          >
            {{ loading ? 'Loading ...' : 'Update' }}
          </button>
        </div>
        <div>
          <button class="button block" (click)="signOut()">Sign Out</button>
        </div>
      </form>
    </div>
    <ng-template #noSession>
      <p>Please sign in.</p>
      <a routerLink="/login">Log in</a>
    </ng-template>
  `,
  styles: [
    `
      .form-widget {
        max-width: 400px;
        margin: 0 auto;
      }
      .inputField {
        width: 100%;
        padding: 0.5rem;
        margin: 0.5rem 0;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .button {
        width: 100%;
        padding: 0.75rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 0.5rem 0;
      }
      .button:disabled {
        background-color: #cccccc;
      }
      .primary {
        background-color: #28a745;
      }
    `,
  ],
})
export default class ProfileListComponent {
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
    this.loadSession(); // Changed from loadProfile to loadSession
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

    try {
      this.loading = true;
      const { user } = this.session;
      const {
        data: profile,
        error,
        status,
      } = await this.supabase.profile(user);
      if (error && status !== 406) throw error;
      if (profile) {
        this.updateProfileForm.patchValue({
          username: profile.username,
          website: profile.website,
          avatar_url: profile.avatar_url,
        });
      }
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      this.loading = false;
    }
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
