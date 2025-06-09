// src/app/core/components/property-reviews.component.ts
import {
  Component,
  Input,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../services/review.service';
import { ReviewListComponent } from './review-list.component';
import { ReviewFormComponent } from './review-form.component';

// UI Components
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideChevronDown,
  lucideChevronUp,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-property-reviews',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmButtonDirective,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    ReviewListComponent,
    ReviewFormComponent,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideChevronDown,
      lucideChevronUp,
    }),
  ],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">نظرات و امتیازها</h2>

        <button
          hlmBtn
          variant="outline"
          (click)="toggleReviewForm()"
          class="gap-2"
        >
          <ng-icon name="lucidePlus" size="16" />
          {{ showReviewForm() ? 'لغو' : 'ثبت نظر جدید' }}
        </button>
      </div>

      <brn-separator hlmSeparator />

      <!-- Review Form -->
      @if (showReviewForm()) {
      <div class="animate-in slide-in-from-top-5 duration-300">
        <app-review-form
          [propertyId]="propertyId"
          [parentId]="replyingToReviewId() || undefined"
          (submitted)="onReviewSubmitted()"
          (cancelled)="onReviewCancelled()"
        />
      </div>
      }

      <!-- Reviews List -->
      <app-review-list
        [propertyId]="propertyId"
        (replyClicked)="onReplyClicked($event)"
      />

      <!-- Load More Button -->
      @if (canLoadMore()) {
      <div class="text-center pt-4">
        <button
          hlmBtn
          variant="outline"
          (click)="loadMoreReviews()"
          [disabled]="reviewService.loading()"
          class="gap-2"
        >
          @if (reviewService.loading()) {
          <div
            class="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"
          ></div>
          در حال بارگذاری... } @else {
          <ng-icon name="lucideChevronDown" size="16" />
          نمایش نظرات بیشتر }
        </button>
      </div>
      }
    </div>
  `,
})
export class PropertyReviewsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) propertyId!: string | number;

  reviewService = inject(ReviewService);

  showReviewForm = signal(false);
  replyingToReviewId = signal<string | undefined>(undefined);
  currentPage = signal(0);
  readonly pageSize = 10;

  ngOnInit() {
    // Reset service state when component initializes
    this.reviewService.reset();
    this.loadInitialData();
  }

  ngOnDestroy() {
    // Clean up when component is destroyed
    this.reviewService.reset();
  }

  private async loadInitialData() {
    // Load both reviews and stats
    await Promise.all([
      this.reviewService.loadReviews(this.propertyId, this.pageSize, 0),
      this.reviewService.loadStats(this.propertyId),
    ]);
  }

  toggleReviewForm() {
    this.showReviewForm.update((show) => !show);
    // Clear reply state when toggling main form
    if (!this.showReviewForm()) {
      this.replyingToReviewId.set(undefined);
    }
  }

  onReviewSubmitted() {
    // Hide form after successful submission
    this.showReviewForm.set(false);
    this.replyingToReviewId.set(undefined);

    // Scroll to top of reviews section
    this.scrollToReviews();
  }

  onReviewCancelled() {
    this.showReviewForm.set(false);
    this.replyingToReviewId.set(undefined);
  }

  onReplyClicked(reviewId: string) {
    // Set reply mode
    this.replyingToReviewId.set(reviewId);
    this.showReviewForm.set(true);

    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('app-review-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  async loadMoreReviews() {
    const nextPage = this.currentPage() + 1;
    const offset = nextPage * this.pageSize;

    try {
      await this.reviewService.loadReviews(
        this.propertyId,
        this.pageSize,
        offset
      );
      this.currentPage.set(nextPage);
    } catch (error) {
      console.error('Error loading more reviews:', error);
    }
  }

  canLoadMore(): boolean {
    const reviews = this.reviewService.reviews();
    const stats = this.reviewService.stats();

    if (!stats || !reviews) return false;

    return (
      reviews.length < stats.total_reviews && !this.reviewService.loading()
    );
  }

  private scrollToReviews() {
    setTimeout(() => {
      const reviewsElement = document.querySelector('app-review-list');
      if (reviewsElement) {
        reviewsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
