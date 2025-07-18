// src/app/core/components/review-list.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../services/review.service';
import { SupabaseService } from '../services/supabase.service';
import { ReviewStats } from '../types/review.types';

// UI
import { HlmCardDirective } from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmBadgeDirective } from '@spartan-ng/helm/badge';
import { HlmSkeletonComponent } from '@spartan-ng/helm/skeleton';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideStar,
  lucideThumbsUp,
  lucideReply,
  lucideTrash2,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmSkeletonComponent,
  ],
  providers: [
    provideIcons({
      lucideStar,
      lucideThumbsUp,
      lucideReply,
      lucideTrash2,
    }),
  ],
  template: `
    <div class="space-y-4">
      <!-- Stats Header -->
      @if (reviewService.stats(); as stats) {
      <div hlmCard class="p-4 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold">نظرات کاربران</h3>
          <p class="text-sm text-gray-600">{{ stats.total_reviews }} نظر</p>
        </div>
        <div class="text-left">
          <div class="flex items-center gap-1">
            <span class="text-2xl font-bold">{{ stats.average_rating }}</span>
            <ng-icon name="lucideStar" size="20" class="text-yellow-400" />
          </div>
          <div class="flex gap-1 mt-1">
            @for (star of [1, 2, 3, 4, 5]; track star) {
            <ng-icon
              name="lucideStar"
              size="16"
              [class.text-yellow-400]="star <= (stats.average_rating ?? 0)"
              [class.text-gray-300]="star > (stats.average_rating ?? 0)"
            />
            }
          </div>
        </div>
      </div>

      <!-- Distribution Bars -->
      <div hlmCard class="p-4 space-y-2">
        @for (rating of [5, 4, 3, 2, 1]; track rating) {
        <div class="flex items-center gap-2 text-sm">
          <span class="w-4">{{ rating }}</span>
          <ng-icon name="lucideStar" size="12" class="text-yellow-400" />
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300 bg-yellow-400"
              [style.width.%]="getDistributionPercentage(stats, rating)"
            ></div>
          </div>
          <span class="w-8 text-gray-600">
            {{ getDistributionCount(stats, rating) }}
          </span>
        </div>
        }
      </div>
      }

      <!-- Loading State -->
      @if (reviewService.loading()) {
      <div class="space-y-4">
        @for (_ of [1, 2, 3]; track $index) {
        <div hlmCard class="p-4">
          <hlm-skeleton class="h-4 w-1/4 mb-2" />
          <hlm-skeleton class="h-3 w-full mb-2" />
          <hlm-skeleton class="h-3 w-3/4" />
        </div>
        }
      </div>
      }

      <!-- Error State -->
      @if (reviewService.error(); as errMsg) {
      <div hlmCard class="p-4 border-red-200 bg-red-50">
        <p class="text-red-600">{{ errMsg }}</p>
      </div>
      }

      <!-- Reviews List -->
      @if (reviewService.reviews(); as reviews) { @if (reviews.length > 0) {
      @for (review of reviews; track review.id ?? $index) {
      <div hlmCard class="p-4">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"
            >
              <!--              @if (review.user?.avatar_url) {
              <img
                [src]="review.user.avatar_url"
                [alt]="review.user?.username || 'کاربر'"
                class="w-full h-full rounded-full object-cover"
              />
              } @else { -->
              <span class="text-sm font-medium text-primary-600">
                {{ getInitials(review.user?.username) }}
              </span>
              <!--              } -->
            </div>
            <div>
              <p class="font-medium">
                {{ review.user?.username || 'کاربر' }}
              </p>
              <p class="text-xs text-gray-500">
                {{ review.created_at ? formatDate(review.created_at) : '' }}
              </p>
            </div>
          </div>
          @if (review.rating != null) {
          <div class="flex items-center gap-1">
            @for (star of [1, 2, 3, 4, 5]; track star) {
            <ng-icon
              name="lucideStar"
              size="16"
              [class.text-yellow-400]="star <= (review.rating ?? 0)"
              [class.text-gray-300]="star > (review.rating ?? 0)"
            />
            }
          </div>
          }
        </div>

        <!-- Content -->
        @if (review.comment) {
        <div class="mb-3">
          <p class="text-gray-700 leading-relaxed">
            {{ review.comment }}
          </p>
        </div>
        }

        <!-- Actions -->
        <div class="flex items-center gap-4 text-sm">
          @if (review.id) {
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            (click)="onReplyClick(review.id)"
            class="text-gray-600"
          >
            <ng-icon name="lucideReply" size="14" class="ml-1" />
            پاسخ
          </button>
          } @if (canDeleteReview(review.user_id) && review.id) {
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            (click)="onDeleteClick(review.id)"
            class="text-red-600"
          >
            <ng-icon name="lucideTrash2" size="14" class="ml-1" />
            حذف
          </button>
          }
        </div>

        <!-- Replies -->

        <!--        @if (review.replies && review.replies.length > 0) {
        <div class="mt-4 mr-6 space-y-3 border-r-2 border-gray-100 pr-4">
          @for (reply of (review.replies ?? []); track reply.id) {
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"
                >
                  @if (reply.user?.avatar_url) {
                  <img
                    [src]="reply.user.avatar_url"
                    [alt]="reply.user?.username || 'کاربر'"
                    class="w-full h-full rounded-full object-cover"
                  />
                  } @else {
                  <span class="text-xs font-medium text-primary-600">
                    {{ getInitials(reply.user?.username) }}
                  </span>
                  }
                </div>
                <div>
                  <p class="text-sm font-medium">
                    {{ reply.user?.username || 'کاربر' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ reply.created_at ? formatDate(reply.created_at) : '' }}
                  </p>
                </div>
              </div>
              @if (canDeleteReview(reply.user_id) && reply.id) {
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                (click)="onDeleteClick(reply.id)"
                class="text-red-600"
              >
                <ng-icon name="lucideTrash2" size="12" />
              </button>
              }
            </div>
            @if (reply.comment) {
            <p class="text-sm text-gray-700">
              {{ reply.comment }}
            </p>
            }
          </div>
          }
        </div>
        } -->
      </div>
      } } @else {
      <!-- No Reviews -->
      <div hlmCard class="p-8 text-center">
        <ng-icon
          name="lucideStar"
          size="48"
          class="mx-auto text-gray-300 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          هنوز نظری ثبت نشده
        </h3>
        <p class="text-gray-600">
          اولین نفری باشید که نظر خود را درباره این ملک ثبت می‌کند
        </p>
      </div>
      } }
    </div>
  `,
})
export class ReviewListComponent implements OnInit {
  @Input({ required: true }) propertyId!: string | number;
  @Output() replyClicked = new EventEmitter<string>();

  reviewService = inject(ReviewService);
  private supabase = inject(SupabaseService);

  ngOnInit() {
    console.log(
      'ReviewListComponent: ngOnInit called with propertyId:',
      this.propertyId
    );
    this.loadData();
  }

  private async loadData() {
    console.log('ReviewListComponent: loadData called');
    try {
      // loadReviews returns a subscription, not a promise
      this.reviewService.loadReviews(this.propertyId);

      // loadStats returns an observable, convert to promise
      await this.reviewService.loadStats(this.propertyId).toPromise();

      console.log('ReviewListComponent: data loaded successfully');
    } catch (error) {
      console.error('ReviewListComponent: error loading data:', error);
    }
  }

  getInitials(username?: string): string {
    if (!username) return '؟';
    return username
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatDate(dateString: string): string {
    const dt = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dt);
  }

  canDeleteReview(reviewUserId?: string): boolean {
    if (!reviewUserId) return false;
    const session = this.supabase.session;
    if (!session || !session.user) return false;
    return session.user.id === reviewUserId;
  }

  onReplyClick(reviewId: string) {
    this.replyClicked.emit(reviewId);
  }

  async onDeleteClick(reviewId: string) {
    if (confirm('آیا از حذف این نظر اطمینان دارید؟')) {
      try {
        await this.reviewService.deleteReview(reviewId).toPromise();
        await this.reviewService.loadStats(this.propertyId).toPromise();
        console.log('ReviewListComponent: review deleted successfully');
      } catch (error) {
        console.error('ReviewListComponent: error deleting review:', error);
      }
    }
  }

  // Helper method to safely get distribution percentage
  getDistributionPercentage(stats: ReviewStats, rating: number): number {
    if (!stats || !stats.total_reviews || stats.total_reviews === 0) return 0;
    if (!stats.rating_distribution) return 0;
    const count = stats.rating_distribution[rating] || 0;
    return (count / stats.total_reviews) * 100;
  }

  // Helper method to safely get distribution count
  getDistributionCount(stats: ReviewStats, rating: number): number {
    if (!stats || !stats.rating_distribution) return 0;
    return stats.rating_distribution[rating] || 0;
  }
}
