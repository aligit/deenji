// src/app/pages/access-denied.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-16 text-center">
      <div
        class="bg-red-50 border border-red-200 rounded-lg p-8 max-w-lg mx-auto"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <h1 class="text-2xl font-bold text-red-700 mb-4">دسترسی غیرمجاز</h1>

        <p class="text-red-600 mb-6">
          شما اجازه دسترسی به این بخش را ندارید. این ممکن است به دلیل
          محدودیت‌های دسترسی یا منقضی شدن نشست شما باشد.
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <a
            [routerLink]="['/']"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            بازگشت به صفحه اصلی
          </a>

          <a
            [routerLink]="['/login']"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            ورود مجدد
          </a>
        </div>
      </div>
    </div>
  `,
})
export default class AccessDeniedPageComponent {}
