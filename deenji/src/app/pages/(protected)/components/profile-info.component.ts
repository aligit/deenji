// src/app/pages/(protected)/components/profile-info.component.ts
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Session } from '@supabase/supabase-js';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-sm text-right">
      <h2 class="text-xl font-semibold mb-6">اطلاعات شخصی</h2>

      <!-- Form for updating personal information -->
      <form
        [formGroup]="profileForm"
        (ngSubmit)="updateProfile()"
        class="space-y-6"
      >
        <!-- Email (read-only) -->
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-gray-700">
            ایمیل
          </label>
          <input
            id="email"
            type="email"
            [value]="session && session.user ? session.user.email : ''"
            disabled
            class="w-full p-3 bg-gray-100 text-gray-600 border border-gray-300 rounded-md"
            dir="ltr"
          />
          <p class="text-xs text-gray-500">ایمیل شما قابل تغییر نیست</p>
        </div>

        <!-- Full Name -->
        <div class="space-y-2">
          <label for="username" class="block text-sm font-medium text-gray-700">
            نام و نام خانوادگی <span class="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="text"
            formControlName="username"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          @if(profileForm.get('username')?.invalid &&
          profileForm.get('username')?.touched) {
          <p class="text-red-500 text-xs">
            لطفاً نام و نام خانوادگی خود را وارد کنید
          </p>
          }
        </div>

        <!-- Phone Number -->
        <div class="space-y-2">
          <label for="phone" class="block text-sm font-medium text-gray-700">
            شماره تلفن <span class="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            formControlName="phone"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            dir="ltr"
          />
          @if(profileForm.get('phone')?.invalid &&
          profileForm.get('phone')?.touched) {
          <p class="text-red-500 text-xs">
            لطفاً یک شماره تلفن معتبر وارد کنید
          </p>
          }
        </div>

        <!-- Website -->
        <div class="space-y-2">
          <label for="website" class="block text-sm font-medium text-gray-700">
            وب‌سایت
          </label>
          <input
            id="website"
            type="url"
            formControlName="website"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            dir="ltr"
          />
        </div>

        <!-- Form Buttons -->
        <div class="flex justify-end pt-4">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-md ml-3 text-gray-700 hover:bg-gray-50 transition-colors"
            (click)="resetForm()"
          >
            انصراف
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            [disabled]="loading || profileForm.invalid || !profileForm.dirty"
          >
            {{ loading ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
          </button>
        </div>
      </form>

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
        اطلاعات شما با موفقیت به‌روزرسانی شد
      </div>
    </div>
  `,
})
export class ProfileInfoComponent {
  @Input() session: Session | null = null;
  @Input() loading = false;
  @Input() username = '';
  @Input() website = '';
  @Output() profileUpdated = new EventEmitter<any>();

  private supabase = inject(SupabaseService);
  private formBuilder = inject(FormBuilder);

  profileForm: FormGroup;
  showSuccess = false;

  constructor() {
    this.profileForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      website: [''],
    });
  }

  ngOnInit() {
    // Initialize form with current values
    this.profileForm.patchValue({
      username: this.username || '',
      website: this.website || '',
      phone: '',
    });
  }

  resetForm() {
    this.profileForm.patchValue({
      username: this.username || '',
      website: this.website || '',
      phone: '',
    });
    this.profileForm.markAsPristine();
  }

  async updateProfile() {
    if (!this.session || this.profileForm.invalid) return;

    try {
      this.loading = true;
      const { user } = this.session;
      const { username, website, phone } = this.profileForm.value;

      // Save profile data to Supabase with the enhanced profile
      const { error } = await this.supabase.updateFullProfile({
        id: user.id,
        username: username || '',
        website: website || '',
        phone: phone || '',
        avatar_url: '',
      });

      if (error) throw error;

      this.showSuccess = true;
      setTimeout(() => (this.showSuccess = false), 3000);

      // Emit event to parent component
      this.profileUpdated.emit({ username, website, phone });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      this.loading = false;
    }
  }
}
