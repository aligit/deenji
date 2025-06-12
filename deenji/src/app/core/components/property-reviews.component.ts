// src/app/core/components/property-reviews.component.ts
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewListComponent } from './review-list.component';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../services/review.service';

@Component({
  selector: 'app-property-reviews',
  standalone: true,
  imports: [CommonModule, ReviewListComponent, ReviewFormComponent],
  template: `
    <div>
      <h2 class="text-2xl font-bold mb-4">نظرات و امتیازها</h2>

      <!-- Review Form -->
      <app-review-form
        [propertyId]="propertyId"
        [parentId]="replyToId()"
        (submitted)="handleReviewSubmitted()"
        (cancelled)="handleReplyCancelled()"
      ></app-review-form>

      <!-- Review List -->
      <app-review-list
        [propertyId]="propertyId"
        (replyClicked)="handleReplyClicked($event)"
      ></app-review-list>
    </div>
  `,
})
export class PropertyReviewsComponent implements OnInit {
  @Input({ required: true }) propertyId!: number;

  private reviewService = inject(ReviewService);

  replyToId = signal<string | undefined>(undefined);

  ngOnInit() {
    console.log(
      'PropertyReviewsComponent initialized with property ID:',
      this.propertyId
    );
    // Make sure we have a valid numeric property ID
    if (!this.propertyId || isNaN(Number(this.propertyId))) {
      console.error('Invalid property ID:', this.propertyId);
      return;
    }

    this.loadReviews();
  }

  private loadReviews() {
    console.log('Loading reviews for property ID:', this.propertyId);

    // Convert to number if it's a string
    const numericPropertyId =
      typeof this.propertyId === 'string'
        ? Number(this.propertyId)
        : this.propertyId;

    // The service handles subscribing
    this.reviewService.loadReviews(numericPropertyId);
    this.reviewService.loadStats(numericPropertyId).subscribe();
  }

  handleReviewSubmitted() {
    console.log('Review submitted, reloading reviews');
    this.replyToId.set(undefined);
    this.loadReviews();
  }

  handleReplyClicked(reviewId: string) {
    console.log('Reply clicked for review ID:', reviewId);
    this.replyToId.set(reviewId);
  }

  handleReplyCancelled() {
    console.log('Reply cancelled');
    this.replyToId.set(undefined);
  }
}
