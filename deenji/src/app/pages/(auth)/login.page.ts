import { Component, inject } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Log In</h1>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
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
            placeholder="Your password"
            class="input input-bordered w-full"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary w-full"
          [disabled]="loading || loginForm.invalid"
        >
          {{ loading ? "Logging in..." : "Log In" }}
        </button>
      </form>
      <p *ngIf="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
      <p class="mt-2">
        Don’t have an account?
        <a routerLink="/signup" class="text-blue-500">Sign up</a>
      </p>
    </div>
  `,
})
export default class LoginComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  loading = false;
  errorMessage = "";

  loginForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    try {
      this.loading = true;
      const { email, password } = this.loginForm.value;
      await this.supabase.signInWithPassword(email!, password!);
      this.router.navigate(["/account"]);
    } catch (error: any) {
      this.errorMessage = error.message || "Login failed";
    } finally {
      this.loading = false;
    }
  }
}
