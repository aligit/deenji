// src/app/pages/(auth)/login.page.ts
import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { SupabaseService } from "../../core/services/supabase.service";
import { ActivatedRoute } from "@angular/router";
import { NgIf } from "@angular/common";

@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIf],
  template: `
    <div class="row flex-center flex">
      <div class="col-6 form-widget" aria-live="polite">
        <h1 class="header">Supabase + Angular</h1>
        <p class="description">Sign in via magic link with your email below</p>
        <form
          [formGroup]="signInForm"
          (ngSubmit)="onSubmit()"
          class="form-widget"
        >
          <div>
            <label for="email">Email</label>
            <input
              id="email"
              formControlName="email"
              class="inputField"
              type="email"
              placeholder="Your email"
            />
          </div>
          <div>
            <button type="submit" class="button block" [disabled]="loading">
              {{ loading ? "Loading" : "Send magic link" }}
            </button>
          </div>
        </form>
        <p *ngIf="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
        <p *ngIf="successMessage" class="text-green-500 mt-2">
          {{ successMessage }}
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        font-size: 2rem;
        font-weight: bold;
      }
      .description {
        margin: 1rem 0;
      }
      .form-widget {
        max-width: 400px;
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
      }
      .button:disabled {
        background-color: #cccccc;
      }
    `,
  ],
})
export default class LoginPageComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  errorMessage = "";
  successMessage = "";

  signInForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params["error"]) {
        this.errorMessage = params["error"];
      }
    });
  }

  async onSubmit(): Promise<void> {
    try {
      this.loading = true;
      const email = this.signInForm.value.email as string;
      const { error } = await this.supabase.signIn(email);
      if (error) throw error;
      this.successMessage = "Check your email for the login link!";
    } catch (error) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
      }
    } finally {
      this.signInForm.reset();
      this.loading = false;
    }
  }
}
