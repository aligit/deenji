import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Profile } from "../../core/models/supabase.model";
import { AuthSession } from "@supabase/supabase-js";
import { SupabaseService } from "../../core/services/supabase.service";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: "app-profile-list",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: ` <div *ngIf="session(); else noSession">
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
            [value]="session()!.user.email"
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
            {{ loading ? "Loading ..." : "Update" }}
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
    </ng-template>`,
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
  session = this.supabase.session;

  updateProfileForm = this.formBuilder.group({
    username: [""],
    website: [""],
    avatar_url: [""],
  });

  constructor() {
    this.loadProfile();
  }

  async loadProfile() {
    const session = this.session();
    if (!session) return;

    try {
      this.loading = true;
      const { user } = session;
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
    const session = this.session();
    if (!session) return;

    try {
      this.loading = true;
      const { user } = session;
      const { username, website, avatar_url } = this.updateProfileForm.value;
      const { error } = await this.supabase.updateProfile({
        id: user.id,
        username: username || "",
        website: website || "",
        avatar_url: avatar_url || "",
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
    this.router.navigate(["/login"]);
  }
}
