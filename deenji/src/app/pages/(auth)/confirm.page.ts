// src/app/pages/(auth)/confirm.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';
import { Session } from '@supabase/supabase-js';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-8 max-w-md">
      <div class="bg-white p-6 rounded-lg shadow-md text-center">
        <div *ngIf="loading">
          <div class="mb-4">
            <svg
              class="animate-spin h-10 w-10 text-blue-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p class="text-lg">در حال تأیید لینک ورود...</p>
        </div>

        <div *ngIf="error" class="text-red-600">
          <p class="text-lg font-bold mb-4">خطا در تأیید!</p>
          <p>{{ error }}</p>
          <div class="mt-6">
            <button
              (click)="navigateToLogin()"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              بازگشت به صفحه ورود
            </button>
          </div>
        </div>

        <div *ngIf="success" class="text-green-600">
          <p class="text-lg font-bold mb-4">تأیید موفقیت‌آمیز!</p>
          <p>شما با موفقیت وارد شدید. در حال انتقال به صفحه پروفایل...</p>
        </div>
      </div>
    </div>
  `,
})
export default class AuthConfirmPageComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  session: Session | null = null;

  loading = true;
  error = '';
  success = false;

  ngOnInit() {
    this.handleMagicLink();
  }

  async handleMagicLink() {
    this.route.fragment.subscribe(async (fragment) => {
      if (fragment) {
        try {
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const errorDescription = params.get('error_description');

          if (errorDescription) {
            throw new Error(errorDescription);
          }

          if (!accessToken) {
            throw new Error('No access token found in URL');
          }

          // Set the session manually using the tokens from the URL
          if (accessToken && refreshToken) {
            // Set the auth session in Supabase with the tokens from the URL
            await this.supabase.setSession(accessToken, refreshToken);

            // Verify the session is properly set
            const { data } = await this.supabase.getSession();

            if (data.session) {
              this.success = true;
              this.loading = false;

              // Wait for the session to be fully propagated
              setTimeout(() => {
                this.router.navigate(['/profile']);
              }, 1500);
            } else {
              throw new Error('Session not established');
            }
          } else {
            throw new Error('Required tokens not found in URL');
          }
        } catch (error) {
          this.loading = false;
          this.error = error instanceof Error ? error.message : 'Unknown error';
          console.error('Magic link error:', this.error);
        }
      } else {
        this.route.queryParams.subscribe((params) => {
          if (Object.keys(params).length === 0) {
            this.navigateToLogin();
          }
        });
      }
    });
  }

  navigateToLogin(error?: string) {
    const queryParams = error ? { error } : {};
    this.router.navigate(['/login'], { queryParams });
  }
}
