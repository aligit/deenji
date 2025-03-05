import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, TranslocoModule],
  template: `
    <footer class="bg-secondary-800 text-white py-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">درباره ما</h3>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >شرکت</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >مشاغل</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >تماس</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">منابع</h3>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >وبلاگ</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >راهنمایی‌ها</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >سوالات متداول</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">قانونی</h3>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >سیاست بازنشر</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >شرایط سرویس</a
                >
              </li>
              <li>
                <a href="#" class="text-primary-300 hover:text-primary-100"
                  >دسترسی‌پذیری</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">پیوند</h3>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </a>
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                  />
                </svg>
              </a>
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.314-.346-.116l-6.38 4.02-2.7-.84c-.58-.183-.593-.577.124-.855l10.55-4.07c.485-.176.915.11.832.832z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div
          class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400"
        >
          <p>© ۱۴۰۴ پلتفرم املاک و مستغلات. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  `,
  standalone: true,
})
export class FooterComponent {}
