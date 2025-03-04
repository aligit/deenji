// src/app/pages/(auth)/login.page.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="container mx-auto p-4 max-w-md">
      <h1 class="text-2xl font-bold mb-4">
        برای ورود / ثبت نام ایمیل خود را وارد کنید
      </h1>

      <form
        *ngIf="!showOtpInput"
        [formGroup]="emailForm"
        (ngSubmit)="onEmailSubmit()"
        class="space-y-4"
      >
        <div>
          <label for="email" class="block mb-1">Email</label>
          <input
            id="email"
            formControlName="email"
            type="email"
            placeholder="Your email"
            class="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          class="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          [disabled]="loading || emailForm.invalid"
        >
          {{ loading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>

      <form
        *ngIf="showOtpInput"
        [formGroup]="otpForm"
        (ngSubmit)="onOtpSubmit()"
        class="space-y-4"
      >
        <p class="text-green-600">Check your email for the code</p>
        <div>
          <label for="otp" class="block mb-1">Enter Code</label>
          <input
            id="otp"
            formControlName="otp"
            type="text"
            placeholder="6-digit code"
            class="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          class="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          [disabled]="loading || otpForm.invalid"
        >
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
        <button
          type="button"
          (click)="resetToEmail()"
          class="w-full p-2 text-blue-500"
        >
          Back to Email
        </button>
      </form>

      <p *ngIf="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
    </div>
  `,
})
export default class LoginPageComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
  showOtpInput = false;
  submittedEmail = '';

  emailForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  otpForm = this.formBuilder.group({
    otp: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    ],
  });

  async onEmailSubmit(): Promise<void> {
    if (this.emailForm.invalid) return;

    try {
      this.loading = true;
      this.errorMessage = '';
      const email = this.emailForm.value.email as string;
      const { error } = await this.supabase.signIn(email);
      if (error) throw error;
      this.submittedEmail = email;
      this.showOtpInput = true;
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
    } finally {
      this.loading = false;
    }
  }

  async onOtpSubmit(): Promise<void> {
    if (this.otpForm.invalid) return;

    try {
      this.loading = true;
      this.errorMessage = '';
      const otp = this.otpForm.value.otp as string;
      const { error } = await this.supabase.verifyOtp(this.submittedEmail, otp);
      if (error) throw error;
      this.router.navigate(['/profile']);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Invalid code';
    } finally {
      this.loading = false;
    }
  }

  resetToEmail() {
    this.showOtpInput = false;
    this.errorMessage = '';
    this.otpForm.reset();
  }
}
