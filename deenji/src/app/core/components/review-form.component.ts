import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ReviewService } from '../services/review.service';
import { SupabaseService } from '../services/supabase.service';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// UI Components
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStar, lucideX } from '@ng-icons/lucide';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmInputDirective,
    RouterModule,
  ],
  providers: [
    provideIcons({
      lucideStar,
      lucideX,
    }),
  ],
  template: `
    <div hlmCard class="p-6">
      @if (!isAuthenticated()) {
      <!-- Not authenticated state -->
      <div class="text-center py-8">
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          برای ثبت نظر وارد شوید
        </h3>
        <p class="text-gray-600 mb-4">
          برای ثبت نظر و امتیازدهی به این ملک، ابتدا وارد حساب کاربری خود شوید
        </p>
        <button hlmBtn [routerLink]="['/login']">ورود به حساب کاربری</button>
      </div>
      } @else {
      <!-- Review form -->
      <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">
            {{ parentId ? 'پاسخ به نظر' : 'نظر شما درباره این ملک' }}
          </h3>

          @if (parentId) {
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-gray-600">در حال پاسخ دادن...</p>
            <button
              type="button"
              hlmBtn
              variant="ghost"
              size="sm"
              (click)="onCancel()"
            >
              <ng-icon name="lucideX" size="16" />
            </button>
          </div>
          }
        </div>

        <!-- Rating (only for top-level reviews) -->
        @if (!parentId) {
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            امتیاز شما <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-1">
            @for (star of [1,2,3,4,5]; track star) {
            <button
              type="button"
              (click)="setRating(star)"
              class="p-1 hover:scale-110 transition-transform"
            >
              <ng-icon
                name="lucideStar"
                size="24"
                [class.text-yellow-400]="star <= selectedRating()"
                [class.text-gray-300]="star > selectedRating()"
                [class.hover:text-yellow-300]="star > selectedRating()"
              />
            </button>
            }
          </div>
          @if (reviewForm.get('rating')?.invalid &&
          reviewForm.get('rating')?.touched) {
          <p class="text-red-500 text-xs mt-1">
            لطفا امتیاز خود را انتخاب کنید
          </p>
          }
        </div>
        }

        <!-- Comment -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ parentId ? 'پاسخ شما' : 'نظر شما' }}
            @if (!parentId) {
            <span class="text-gray-500">(اختیاری)</span>
            }
          </label>
          <textarea
            hlmInput
            formControlName="comment"
            rows="4"
            class="min-h-[100px] w-full"
            [placeholder]="
              parentId
                ? 'پاسخ خود را بنویسید...'
                : 'نظر خود را درباره این ملک بنویسید...'
            "
          ></textarea>
          @if (reviewForm.get('comment')?.invalid &&
          reviewForm.get('comment')?.touched) {
          <p class="text-red-500 text-xs mt-1">
            @if (reviewForm.get('comment')?.errors?.['required']) { لطفا نظر خود
            را بنویسید } @if (reviewForm.get('comment')?.errors?.['maxlength'])
            { نظر شما نباید بیش از ۲۰۰۰ کاراکتر باشد }
          </p>
          }
        </div>

        <!-- Submit buttons -->
        <div class="flex justify-end gap-3">
          @if (parentId) {
          <button type="button" hlmBtn variant="outline" (click)="onCancel()">
            انصراف
          </button>
          }

          <button
            type="submit"
            hlmBtn
            [disabled]="reviewForm.invalid || submitting()"
          >
            {{
              submitting() ? 'در حال ثبت...' : parentId ? 'ثبت پاسخ' : 'ثبت نظر'
            }}
          </button>
        </div>
      </form>

      <!-- Error message -->
      @if (error()) {
      <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-600 text-sm">{{ error() }}</p>
      </div>
      } }
    </div>
  `,
})
export class ReviewFormComponent implements OnInit {
  @Input({ required: true }) propertyId!: string | number;
  @Input() parentId?: string;
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private readonly supabase = inject(SupabaseService);

  reviewForm!: FormGroup;
  selectedRating = signal(0);
  submitting = signal(false);
  error = signal<string | null>(null);
  public sessionSignal = signal<Session | null>(null);

  ngOnInit() {
    this.reviewForm = this.fb.group({
      rating: [null],
      comment: ['', [Validators.maxLength(2000)]],
    });
    this.loadSession();
    this.updateValidators();
  }

  async loadSession() {
    try {
      // Get initial session
      const { data } = await this.supabase.getSession();
      this.sessionSignal.set(data.session);
      console.log(
        'Initial session loaded:',
        data.session ? 'Authenticated' : 'Not authenticated'
      );

      // Set up auth state change listener
      this.supabase.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          console.log(
            'Auth state changed:',
            event,
            session ? 'Authenticated' : 'Not authenticated'
          );
          this.sessionSignal.set(session);
        }
      );
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  private updateValidators() {
    const ratingControl = this.reviewForm.get('rating');
    const commentControl = this.reviewForm.get('comment');

    if (this.parentId) {
      // For replies: comment is required, rating is not allowed
      ratingControl?.clearValidators();
      commentControl?.setValidators([
        Validators.required,
        Validators.maxLength(2000),
      ]);
    } else {
      // For reviews: rating is required, comment is optional
      ratingControl?.setValidators([Validators.required]);
      commentControl?.setValidators([Validators.maxLength(2000)]);
    }

    ratingControl?.updateValueAndValidity();
    commentControl?.updateValueAndValidity();
  }

  isAuthenticated(): boolean {
    const hasSession = !!this.sessionSignal();
    console.log(
      'Checking authentication state:',
      hasSession ? 'Authenticated' : 'Not authenticated'
    );
    return hasSession;
  }

  setRating(rating: number) {
    if (this.parentId) return;

    this.selectedRating.set(rating);
    this.reviewForm.patchValue({ rating });
  }

  /**
   * Submit the review form
   */
  onSubmit() {
    if (this.reviewForm.invalid) return;

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.reviewForm.value;

    // Ensure property_id is a number
    const numericPropertyId =
      typeof this.propertyId === 'string'
        ? Number(this.propertyId)
        : this.propertyId;

    console.log(
      `Submitting review for property ID: ${numericPropertyId} (${typeof numericPropertyId})`
    );

    // Check if user is authenticated directly
    if (!this.supabase.session) {
      this.error.set('You must be logged in to create a review');
      this.submitting.set(false);
      return;
    }

    console.log('Authenticated as user:', this.supabase.session.user.id);

    this.reviewService
      .createReview({
        property_id: numericPropertyId,
        rating: this.parentId ? undefined : formValue.rating,
        comment: formValue.comment || undefined,
        parent_id: this.parentId,
      })
      .subscribe({
        next: () => {
          console.log('Review submitted successfully');
          // Reset form
          this.reviewForm.reset();
          this.selectedRating.set(0);

          // Reload stats if it's a new review (not a reply)
          if (!this.parentId) {
            this.reviewService.loadStats(numericPropertyId).subscribe();
          }

          this.submitted.emit();
          this.submitting.set(false);
        },
        error: (err: Error | unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : 'An unknown error occurred';

          // Check for duplicate review error
          if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            err.code === '23505'
          ) {
            this.error.set('You have already reviewed this property');
          } else {
            console.error('Error submitting review:', errorMessage);
            this.error.set(errorMessage);
          }

          this.submitting.set(false);
        },
      });
  }

  onCancel() {
    this.reviewForm.reset();
    this.selectedRating.set(0);
    this.error.set(null);
    this.cancelled.emit();
  }
}
