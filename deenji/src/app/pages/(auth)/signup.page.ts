import { Component, inject } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Sign Up</h1>
      <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="email" class="block">Email</label>
          <input
            id="email"
            formControlName="email"
            type="email"
            placeholder="Your email"
            class="input input-bordered w-full"
          />
        </div>
        <div>
          <label for="password" class="block">Password</label>
          <input
            id="password"
            formControlName="password"
            type="password"
            placeholder="Your password (min 6 characters)"
            class="input input-bordered w-full"
          />
        </div>
        <div>
          <label for="phone" class="block">Phone (optional)</label>
          <input
            id="phone"
            formControlName="phone"
            type="tel"
            placeholder="+1234567890"
            class="input input-bordered w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary w-full"
          [disabled]="loading || signupForm.invalid"
        >
          {{ loading ? "Signing up..." : "Sign Up" }}
        </button>
      </form>
      <p *ngIf="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </p>
      <p class="mt-2">
        Already have an account?
        <a routerLink="/login" class="text-blue-500">Log in</a>
      </p>
    </div>
  `,
})
export default class SignupComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  loading = false;
  errorMessage = "";
  successMessage = "";

  signupForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    phone: [""], // Optional phone field
  });

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) return;

    try {
      this.loading = true;
      const { email, password, phone } = this.signupForm.value;
      await this.supabase.signUp(email!, password!, phone || undefined);
      this.successMessage =
        "Sign-up successful! Check your email to confirm your account.";
      this.signupForm.reset();
    } catch (error: any) {
      this.errorMessage = error.message || "Sign-up failed";
    } finally {
      this.loading = false;
    }
  }
}
