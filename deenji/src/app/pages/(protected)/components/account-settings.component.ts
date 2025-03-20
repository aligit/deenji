// src/app/pages/(protected)/components/account-settings.component.ts
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Session } from '@supabase/supabase-js';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-sm text-right">
      <h2 class="text-xl font-semibold mb-6">تنظیمات حساب</h2>

      <!-- Language Settings -->
      <div class="mb-8 pb-6 border-b border-gray-200">
        <h3 class="text-lg font-medium mb-4">زبان و محلی‌سازی</h3>

        <form
          [formGroup]="languageForm"
          (ngSubmit)="saveLanguage()"
          class="space-y-4"
        >
          <div>
            <label
              for="language"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              زبان نمایش
            </label>
            <select
              id="language"
              formControlName="language"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              [disabled]="!languageForm.dirty"
            >
              ذخیره تنظیمات زبان
            </button>
          </div>
        </form>
      </div>

      <!-- Account Management -->
      <div>
        <h3 class="text-lg font-medium mb-4">مدیریت حساب</h3>

        <div class="space-y-4">
          <div class="p-4 bg-gray-50 rounded-md">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900">خروج از حساب کاربری</h4>
                <p class="text-sm text-gray-500">از سامانه خارج شوید</p>
              </div>
              <button
                (click)="signOutRequested.emit()"
                class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                خروج
              </button>
            </div>
          </div>

          <div class="p-4 bg-red-50 rounded-md border border-red-100">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-red-700">حذف حساب کاربری</h4>
                <p class="text-sm text-red-500">
                  این عملیات غیرقابل بازگشت است
                </p>
              </div>
              <button
                (click)="confirmDeleteAccount()"
                class="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              >
                حذف حساب
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success message -->
      <div
        *ngIf="showSuccess"
        class="mt-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 ml-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        تنظیمات با موفقیت ذخیره شد
      </div>
    </div>
  `,
})
export class AccountSettingsComponent {
  @Input() session: Session | null = null;
  @Input() loading = false;
  @Output() signOutRequested = new EventEmitter<void>();

  private formBuilder = inject(FormBuilder);

  languageForm: FormGroup;
  showSuccess = false;

  constructor() {
    this.languageForm = this.formBuilder.group({
      language: ['fa', Validators.required],
    });
  }

  saveLanguage() {
    if (this.languageForm.invalid) return;

    // Would implement language change logic
    // this.translocoService.setActiveLang(this.languageForm.value.language);

    this.showSuccess = true;
    setTimeout(() => (this.showSuccess = false), 3000);
    this.languageForm.markAsPristine();
  }

  confirmDeleteAccount() {
    if (
      confirm(
        'آیا از حذف حساب کاربری خود اطمینان دارید؟ این عملیات غیرقابل بازگشت است.'
      )
    ) {
      // Would implement account deletion logic
      console.log('Account deletion confirmed');
    }
  }
}
