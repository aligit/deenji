// src/app/core/components/similar-properties.component.ts
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectTrpcClient } from '../../../trpc-client';
import { firstValueFrom } from 'rxjs';

// UI Components
import { HlmCardDirective } from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmSkeletonComponent } from '@spartan-ng/helm/skeleton';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMapPin,
  lucideHouse,
  lucideBath,
  lucideBed,
  lucideMaximize,
  lucideArrowLeft,
} from '@ng-icons/lucide';

interface PropertySummary {
  id: number;
  title: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  district?: string;
  city?: string;
  type?: string;
}

@Component({
  selector: 'app-similar-properties',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmSkeletonComponent,
  ],
  providers: [
    provideIcons({
      lucideMapPin,
      lucideHouse,
      lucideBath,
      lucideBed,
      lucideMaximize,
      lucideArrowLeft,
    }),
  ],
  template: `
    <div hlmCard class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">املاک مشابه</h3>
        <button hlmBtn variant="ghost" size="sm" [routerLink]="['/properties']">
          مشاهده همه
          <ng-icon name="lucideArrowLeft" size="14" class="mr-2" />
        </button>
      </div>

      @if (loading()) {
      <!-- Loading State -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of [1, 2, 3, 4]; track item) {
        <div class="space-y-3">
          <hlm-skeleton class="w-full h-32 rounded-lg" />
          <hlm-skeleton class="h-4 w-3/4" />
          <hlm-skeleton class="h-6 w-1/2" />
        </div>
        }
      </div>
      } @else if (similarProperties().length > 0) {
      <!-- Similar Properties -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (property of similarProperties(); track property.id) {
        <div
          hlmCard
          class="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          [routerLink]="['/properties', property.id]"
        >
          <!-- Property Image -->
          <div class="relative h-32 bg-gray-100">
            @if (property.images && property.images.length > 0) {
            <img
              [src]="property.images[0]"
              [alt]="property.title"
              class="w-full h-full object-cover"
            />
            } @else {
            <div class="w-full h-full flex items-center justify-center">
              <ng-icon name="lucideHouse" size="24" class="text-gray-400" />
            </div>
            }
          </div>

          <!-- Property Info -->
          <div class="p-4">
            <h4 class="font-medium text-gray-900 mb-2 line-clamp-2">
              {{ property.title }}
            </h4>

            <!-- Price -->
            <div class="text-lg font-bold text-primary-600 mb-3">
              {{ formatPrice(property.price) }} تومان
            </div>

            <!-- Features -->
            <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
              @if (property.bedrooms) {
              <div class="flex items-center gap-1">
                <ng-icon name="lucideBed" size="14" />
                <span>{{ property.bedrooms }}</span>
              </div>
              } @if (property.bathrooms) {
              <div class="flex items-center gap-1">
                <ng-icon name="lucideBath" size="14" />
                <span>{{ property.bathrooms }}</span>
              </div>
              } @if (property.area) {
              <div class="flex items-center gap-1">
                <ng-icon name="lucideMaximize" size="14" />
                <span>{{ property.area }}م²</span>
              </div>
              }
            </div>

            <!-- Location -->
            @if (property.district || property.city) {
            <div class="flex items-center gap-1 text-xs text-gray-500">
              <ng-icon name="lucideMapPin" size="12" />
              <span>{{ property.district || property.city }}</span>
            </div>
            }
          </div>
        </div>
        }
      </div>
      } @else {
      <!-- No Similar Properties -->
      <div class="text-center py-8">
        <ng-icon
          name="lucideHouse"
          size="32"
          class="mx-auto text-gray-400 mb-3"
        />
        <p class="text-gray-600">املاک مشابهی یافت نشد</p>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class SimilarPropertiesComponent implements OnInit {
  @Input() propertyId!: number;
  @Input() limit = 4;

  private trpc = injectTrpcClient();

  loading = signal(true);
  similarProperties = signal<PropertySummary[]>([]);

  ngOnInit() {
    if (this.propertyId) {
      this.loadSimilarProperties();
    }
  }

  // Replace the existing loadSimilarProperties method with:
  private async loadSimilarProperties() {
    try {
      this.loading.set(true);

      // Convert Observable to Promise using firstValueFrom
      const result = await firstValueFrom(
        this.trpc.property.getSimilarProperties.query({
          propertyId: this.propertyId,
          limit: this.limit,
        })
      );

      this.similarProperties.set(result.properties as PropertySummary[]);
    } catch (error) {
      console.error('Error loading similar properties:', error);
      this.similarProperties.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  formatPrice(price: number): string {
    if (price >= 1_000_000_000) {
      const billions = price / 1_000_000_000;
      return billions % 1 === 0
        ? `${billions} میلیارد`
        : `${billions.toFixed(1)} میلیارد`;
    } else if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      return millions % 1 === 0
        ? `${millions} میلیون`
        : `${millions.toFixed(1)} میلیون`;
    }
    return price.toLocaleString('fa-IR');
  }
}
