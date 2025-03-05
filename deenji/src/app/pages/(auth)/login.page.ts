// src/app/pages/(auth)/login.page.ts
import { Component, inject, NgZone, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, CommonModule, TranslocoModule],
  template: `
    <div class="container mx-auto p-4 max-w-md">
      <ng-container *transloco="let t">
        <h1 class="text-2xl font-bold mb-4">
          {{ t('signInSignup') }}
        </h1>

        <!-- Error message display -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {{ errorMessage }}
        </div>

        <!-- Success message display -->
        <div
          *ngIf="successMessage"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
        >
          {{ successMessage }}
        </div>

        <!-- Email form -->
        <form
          *ngIf="!showOtpInput"
          [formGroup]="emailForm"
          (ngSubmit)="onEmailSubmit()"
          class="space-y-4"
        >
          <div>
            <label for="email" class="block mb-1">{{ t('emailLabel') }}</label>
            <input
              id="email"
              formControlName="email"
              type="email"
              placeholder="{{ t('yourEmailPlaceholder') }}"
              class="w-full p-2 border rounded text-right"
              dir="ltr"
            />
            <div
              *ngIf="
                emailForm.get('email')?.invalid &&
                emailForm.get('email')?.touched
              "
              class="text-red-500 mt-1 text-sm"
            >
              {{ t('invalidEmailMessage') }}
            </div>
          </div>
          <button
            type="submit"
            class="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            [disabled]="loading || emailForm.invalid"
          >
            {{ loading ? t('sendingInProgress') : t('sendVerificationCode') }}
          </button>
        </form>

        <!-- OTP form -->
        <form
          *ngIf="showOtpInput"
          [formGroup]="otpForm"
          (ngSubmit)="onOtpSubmit()"
          class="space-y-4"
        >
          <p class="text-green-600">{{ t('checkEmailForCode') }}</p>
          <p class="text-gray-600">
            {{ t('oneTimePasswordSent') }} {{ submittedEmail }}
          </p>
          <div>
            <label for="otp" class="block mb-1">{{
              t('verificationCodeLabel')
            }}</label>
            <input
              id="otp"
              formControlName="otp"
              type="text"
              placeholder="6-digit code"
              class="w-full p-2 border rounded text-center"
              dir="ltr"
              autocomplete="one-time-code"
            />
            <div
              *ngIf="otpForm.get('otp')?.invalid && otpForm.get('otp')?.touched"
              class="text-red-500 mt-1 text-sm"
            >
              {{ t('invalidCodeMessage') }}
            </div>
          </div>
          <button
            type="submit"
            class="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            [disabled]="loading || otpForm.invalid"
          >
            {{
              loading ? t('verifyingInProgress') : t('verificationCodeLabel')
            }}
          </button>
          <button
            type="button"
            (click)="resetToEmail()"
            class="w-full p-2 text-blue-500"
          >
            {{ t('returnToEmailPage') }}
          </button>
          <button
            type="button"
            (click)="resendOTP()"
            class="w-full p-2 text-gray-500"
            [disabled]="loading || resendCooldown > 0"
          >
            {{
              resendCooldown > 0
                ? t('resendCode') + ' (' + resendCooldown + 's)'
                : t('resendCode')
            }}
          </button>
        </form>
      </ng-container>
    </div>
  `,
})
export default class LoginPageComponent implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translateService = inject(TranslocoService);
  private readonly ngZone = inject(NgZone);

  loading = false;
  errorMessage = '';
  successMessage = '';
  showOtpInput = false;
  submittedEmail = '';
  resendCooldown = 0;
  private resendTimer: any;

  emailForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  otpForm = this.formBuilder.group({
    otp: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    ],
  });

  constructor() {
    // Check if there's an error from URL params (e.g., redirected from confirm page)
    this.route.queryParams.subscribe((params) => {
      if (params['error']) {
        this.errorMessage = params['error'];
      }
    });

    // Debug logging to check environment variables
    if (
      !import.meta.env['VITE_supabaseUrl'] ||
      !import.meta.env['VITE_supabaseKey']
    ) {
      console.error('Missing Supabase environment variables');
    }
  }

  async onEmailSubmit(): Promise<void> {
    if (this.emailForm.invalid) return;

    try {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.emailForm.value.email as string;
      console.log('Attempting to sign in with email:', email);

      const response = await this.supabase.signIn(email);

      if (response.error) {
        throw response.error;
      }

      console.log('Sign in successful, response:', response);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.submittedEmail = email;
        this.showOtpInput = true;
        this.successMessage = this.getTranslation('codeSentSuccess');
        this.loading = false; // Explicitly set loading to false
        this.startResendCooldown();
      });
    } catch (error) {
      console.error('Error during sign in:', error);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.loading = false;
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Error sending email. Please try again.';
      });
    }
  }

  async onOtpSubmit(): Promise<void> {
    if (this.otpForm.invalid) return;

    try {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const otp = this.otpForm.value.otp as string;
      console.log('Attempting to verify OTP for email:', this.submittedEmail);

      const response = await this.supabase.verifyOtp(this.submittedEmail, otp);

      if (response.error) {
        throw response.error;
      }

      console.log('OTP verification successful, response:', response);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.successMessage = this.getTranslation('loginSuccess');
        this.loading = false;

        // Navigate to profile after successful login
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 500);
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.loading = false;
        this.errorMessage =
          error instanceof Error ? error.message : 'Invalid code entered.';
      });
    }
  }

  resetToEmail(): void {
    this.showOtpInput = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.otpForm.reset();
    this.clearResendTimer();
  }

  async resendOTP(): Promise<void> {
    if (this.resendCooldown > 0 || this.loading) return;

    try {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      console.log('Resending OTP to email:', this.submittedEmail);

      const response = await this.supabase.signIn(this.submittedEmail);

      if (response.error) {
        throw response.error;
      }

      console.log('OTP resend successful, response:', response);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.successMessage = this.getTranslation('codeSentSuccess');
        this.loading = false;
        this.startResendCooldown();
      });
    } catch (error) {
      console.error('Error resending OTP:', error);

      // Ensure we're updating the UI in the Angular zone
      this.ngZone.run(() => {
        this.loading = false;
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Error resending code. Please try again.';
      });
    }
  }

  private startResendCooldown(seconds = 60): void {
    this.clearResendTimer();
    this.resendCooldown = seconds;

    this.resendTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          this.clearResendTimer();
        }
      });
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.resendCooldown = 0;
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  private getTranslation(key: string): string {
    return this.translateService.translate(key) || key;
  }
}
