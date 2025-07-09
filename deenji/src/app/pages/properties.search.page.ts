// deenji/src/app/pages/properties.search.page.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { injectTrpcClient } from '../../trpc-client';
import { PropertyResult } from '../core/types/property.types';

// UI Components
import { HlmCardDirective } from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmInputDirective } from '@spartan-ng/helm/input';
import { HlmLabelDirective } from '@spartan-ng/helm/label';
import { HlmBadgeDirective } from '@spartan-ng/helm/badge';
import { HlmCheckboxComponent } from '@spartan-ng/helm/checkbox';
import { HlmSkeletonComponent } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerComponent } from '@spartan-ng/helm/spinner';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import {
  HlmTooltipComponent,
  HlmTooltipTriggerDirective,
} from '@spartan-ng/helm/tooltip';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideFunnel,
  lucideMapPin,
  lucideHouse,
  lucideBath,
  lucideBed,
  lucideMaximize,
  lucideChevronDown,
  lucideX,
  lucideSettings,
  lucideChevronLeft,
  lucideChevronRight,
  lucideHeart,
  lucideShare2,
} from '@ng-icons/lucide';

// Components
import { MapComponent } from '../core/components/map.component';
import { MapService } from '../core/services/map.service';

type SortField = 'date' | 'price' | 'relevance' | 'area' | 'created_at';

interface SearchParams {
  q?: string;
  property_type?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  hasBalcony?: boolean;
  city?: string;
  district?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  location?: {
    lat: number;
    lon: number;
  };
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmBadgeDirective,
    HlmCheckboxComponent,
    HlmSkeletonComponent,
    HlmSpinnerComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
    BrnTooltipContentDirective,
    MapComponent,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideFunnel,
      lucideMapPin,
      lucideHouse,
      lucideBath,
      lucideBed,
      lucideMaximize,
      lucideChevronDown,
      lucideX,
      lucideSettings,
      lucideChevronLeft,
      lucideChevronRight,
      lucideHeart,
      lucideShare2,
    }),
  ],
  template: `
    <div class="min-h-screen bg-gray-50" dir="rtl">
      <!-- Header with Search and Controls -->
      <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-4">
            <!-- Search Bar -->
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-1 relative">
                <ng-icon
                  name="lucideSearch"
                  size="20"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  hlmInput
                  type="text"
                  placeholder="جستجو در املاک..."
                  class="w-full pr-10"
                  [formControl]="$any(searchForm.get('q'))"
                />
              </div>
              <button hlmBtn variant="outline" (click)="toggleFilters()">
                <ng-icon name="lucideFunnel" size="16" class="ml-2" />
                فیلترها
              </button>
            </div>

            <!-- Results Summary and Sort -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                {{ totalResults() }} ملک یافت شد
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">مرتب‌سازی:</span>
                <brn-select
                  class="inline-block"
                  [value]="sortBy()"
                  (valueChange)="onSortChange($event)"
                >
                  <hlm-select-trigger class="w-40">
                    <hlm-select-value />
                  </hlm-select-trigger>
                  <hlm-select-content>
                    <hlm-option value="relevance">مرتبط‌ترین</hlm-option>
                    <hlm-option value="price">قیمت</hlm-option>
                    <hlm-option value="date">تاریخ</hlm-option>
                    <hlm-option value="area">متراژ</hlm-option>
                    <hlm-option value="created_at">جدیدترین</hlm-option>
                  </hlm-select-content>
                </brn-select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content: Side-by-Side Layout -->
      <div class="flex h-[calc(100vh-144px)]">
        <!-- List Panel - Left Side -->
        <div class="w-1/2 overflow-y-auto p-4">
          <!-- Filters Sidebar (Collapsed by Default) -->
          @if (showFilters()) {
          <div class="mb-6">
            <div hlmCard class="p-6">
              <h3 class="font-semibold text-gray-900 mb-4">فیلترها</h3>
              <!-- Price Range -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium text-gray-800">محدوده قیمت</h4>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    hlmInput
                    placeholder="حداقل قیمت"
                    [formControl]="$any(searchForm.get('minPrice'))"
                  />
                  <input
                    hlmInput
                    placeholder="حداکثر قیمت"
                    [formControl]="$any(searchForm.get('maxPrice'))"
                  />
                </div>
              </div>

              <!-- Area Range -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium text-gray-800">متراژ</h4>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    hlmInput
                    placeholder="حداقل متراژ"
                    [formControl]="$any(searchForm.get('minArea'))"
                  />
                  <input
                    hlmInput
                    placeholder="حداکثر متراژ"
                    [formControl]="$any(searchForm.get('maxArea'))"
                  />
                </div>
              </div>

              <!-- Bedrooms -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium text-gray-800">تعداد خواب</h4>
                <div class="grid grid-cols-3 gap-2">
                  <input
                    hlmInput
                    placeholder="حداقل"
                    [formControl]="$any(searchForm.get('minBedrooms'))"
                  />
                  <input
                    hlmInput
                    placeholder="حداکثر"
                    [formControl]="$any(searchForm.get('maxBedrooms'))"
                  />
                  <input
                    hlmInput
                    placeholder="دقیق"
                    [formControl]="$any(searchForm.get('bedrooms'))"
                  />
                </div>
              </div>

              <!-- Property Type Select -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium text-gray-800">نوع ملک</h4>
                <brn-select
                  class="w-full"
                  [formControl]="$any(searchForm.get('property_type'))"
                >
                  <hlm-select-trigger class="w-full">
                    <hlm-select-value />
                  </hlm-select-trigger>
                  <hlm-select-content>
                    <hlm-option value="">همه انواع</hlm-option>
                    <hlm-option value="آپارتمان">آپارتمان</hlm-option>
                    <hlm-option value="خانه">خانه</hlm-option>
                    <hlm-option value="ویلا">ویلا</hlm-option>
                    <hlm-option value="زمین">زمین</hlm-option>
                  </hlm-select-content>
                </brn-select>
              </div>

              <!-- Property Features -->
              <div class="space-y-4 mb-6">
                <h4 class="font-medium text-gray-800">امکانات</h4>
                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="searchForm.get('hasElevator')?.value"
                    (checkedChange)="onFeatureChange('hasElevator', $event)"
                  />
                  <span>آسانسور</span>
                </label>
                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="searchForm.get('hasParking')?.value"
                    (checkedChange)="onFeatureChange('hasParking', $event)"
                  />
                  <span>پارکینگ</span>
                </label>
                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="searchForm.get('hasStorage')?.value"
                    (checkedChange)="onFeatureChange('hasStorage', $event)"
                  />
                  <span>انباری</span>
                </label>
                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="searchForm.get('hasBalcony')?.value"
                    (checkedChange)="onFeatureChange('hasBalcony', $event)"
                  />
                  <span>بالکن</span>
                </label>
              </div>
            </div>
          </div>
          }

          <!-- Property List -->
          @if (loading()) {
          <!-- Loading State -->
          <div class="space-y-4">
            @for (item of [1,2,3,4,5]; track item) {
            <div hlmCard class="p-6">
              <div class="flex gap-4">
                <hlm-skeleton class="w-48 h-32 rounded-lg" />
                <div class="flex-1 space-y-3">
                  <hlm-skeleton class="h-6 w-3/4" />
                  <hlm-skeleton class="h-4 w-1/2" />
                  <hlm-skeleton class="h-4 w-1/3" />
                </div>
              </div>
            </div>
            }
          </div>
          } @else if (mappedProperties().length > 0) {
          <!-- Property Cards -->
          <div class="space-y-4">
            @for (property of mappedProperties(); track property.id) {
            <hlm-tooltip>
              <div
                id="property-card-{{ property.id }}"
                hlmTooltipTrigger
                hlmCard
                class="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                [class.ring-2]="
                  mapService.highlightedPropertyId() === property.id
                "
                [class.ring-primary-500]="
                  mapService.highlightedPropertyId() === property.id
                "
                [attr.data-property-id]="property.id"
                (mouseenter)="onCardHover(property)"
                (click)="onCardClick(property)"
              >
                <div class="flex">
                  <!-- Property Image -->
                  <div class="relative w-48 h-36 bg-gray-200 flex-shrink-0">
                    @if (property.images && property.images.length > 0) {
                    <img
                      [src]="property.images[0]"
                      [alt]="property.title"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <ng-icon
                        name="lucideHouse"
                        size="24"
                        class="text-gray-400"
                      />
                    </div>
                    }

                    <!-- Investment Score Badge -->
                    @if (property.investment_score) {
                    <div class="absolute top-2 right-2">
                      <span
                        hlmBadge
                        variant="secondary"
                        class="bg-green-600 text-white"
                      >
                        امتیاز: {{ property.investment_score }}
                      </span>
                    </div>
                    }

                    <!-- Favorite Button -->
                    <button
                      class="absolute top-2 left-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <ng-icon
                        name="lucideHeart"
                        size="16"
                        class="text-gray-600"
                      />
                    </button>
                  </div>

                  <!-- Property Details -->
                  <div class="flex-1 p-4">
                    <div class="flex justify-between items-start mb-2">
                      <h3
                        class="text-lg font-semibold text-gray-900 line-clamp-1"
                      >
                        {{ property.title }}
                      </h3>
                      <button
                        class="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ng-icon
                          name="lucideShare2"
                          size="16"
                          class="text-gray-500"
                        />
                      </button>
                    </div>

                    <!-- Price -->
                    <div class="text-2xl font-bold text-primary-600 mb-3">
                      {{ formatPrice(property.price) }} تومان
                    </div>

                    <!-- Property Features -->
                    <div
                      class="flex items-center gap-4 text-sm text-gray-600 mb-3"
                    >
                      @if (property.bedrooms) {
                      <div class="flex items-center gap-1">
                        <ng-icon name="lucideBed" size="14" />
                        <span>{{ property.bedrooms }} خواب</span>
                      </div>
                      } @if (property.bathrooms) {
                      <div class="flex items-center gap-1">
                        <ng-icon name="lucideBath" size="14" />
                        <span>{{ property.bathrooms }} سرویس</span>
                      </div>
                      } @if (property.area) {
                      <div class="flex items-center gap-1">
                        <ng-icon name="lucideMaximize" size="14" />
                        <span>{{ property.area }}م²</span>
                      </div>
                      }
                    </div>

                    <!-- Location -->
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <ng-icon name="lucideMapPin" size="14" />
                      <span>{{
                        property.district || property.city || 'تهران'
                      }}</span>
                    </div>

                    <!-- Features -->
                    <div class="flex gap-2 mt-3">
                      @if (property.has_parking) {
                      <span hlmBadge variant="outline">پارکینگ</span>
                      } @if (property.has_elevator) {
                      <span hlmBadge variant="outline">آسانسور</span>
                      } @if (property.has_balcony) {
                      <span hlmBadge variant="outline">بالکن</span>
                      } @if (property.has_storage) {
                      <span hlmBadge variant="outline">انباری</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tooltip Content -->
              <span *brnTooltipContent class="max-w-xs p-3">
                <p class="font-semibold mb-2">اطلاعات بیشتر</p>
                @if (property.year_built) {
                <p class="text-sm">سال ساخت: {{ property.year_built }}</p>
                } @if (property.price_per_meter) {
                <p class="text-sm">
                  قیمت هر متر: {{ formatPrice(property.price_per_meter) }} تومان
                </p>
                } @if (property.description) {
                <p class="text-sm mt-2">
                  {{ property.description | slice : 0 : 100 }}...
                </p>
                }
              </span>
            </hlm-tooltip>
            }
          </div>

          <!-- Pagination -->
          <div class="mt-6 bg-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                نمایش
                {{ (currentPage() - 1) * pageSize() + 1 }}
                تا
                {{ Math.min(currentPage() * pageSize(), totalResults()) }}
                از {{ totalResults() }} نتیجه
              </div>

              <div class="flex items-center gap-2">
                <button
                  hlmBtn
                  variant="outline"
                  size="default"
                  [disabled]="currentPage() === 1"
                  (click)="onPageChange(currentPage() - 1)"
                >
                  <ng-icon name="lucideChevronRight" size="16" />
                  قبلی
                </button>

                <div class="flex items-center gap-1">
                  @for (page of getPaginationPages(); track page) { @if (page
                  === '...') {
                  <span class="px-2">...</span>
                  } @else {
                  <button
                    hlmBtn
                    [variant]="page === currentPage() ? 'default' : 'outline'"
                    size="default"
                    (click)="onPageChange(page)"
                    class="min-w-[2.5rem]"
                  >
                    {{ page }}
                  </button>
                  } }
                </div>

                <button
                  hlmBtn
                  variant="outline"
                  size="default"
                  [disabled]="currentPage() === getTotalPages()"
                  (click)="onPageChange(currentPage() + 1)"
                >
                  بعدی
                  <ng-icon name="lucideChevronLeft" size="16" />
                </button>
              </div>
            </div>
          </div>
          } @else {
          <!-- Empty State -->
          <div hlmCard class="p-12 text-center">
            <ng-icon
              name="lucideHouse"
              size="48"
              class="mx-auto text-gray-400 mb-4"
            />
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              ملکی یافت نشد
            </h3>
            <p class="text-gray-600">معیارهای جستجو را تغییر دهید</p>
          </div>
          }
        </div>

        <!-- Map Panel - Right Side -->
        <div class="w-1/2 bg-gray-100">
          <div class="h-full">
            <app-map
              [properties]="mappedProperties()"
              [highlightedPropertyId]="
                toNumberOrUndefined(mapService.highlightedPropertyId())
              "
              (onMapClick)="onMarkerClick($event)"
            ></app-map>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .highlight-property {
        @apply ring-2 ring-primary-500 bg-primary-50 transition-all duration-500;
      }
    `,
  ],
})
export default class PropertiesSearchPageComponent implements OnInit {
  private trpc = injectTrpcClient();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  public mapService = inject(MapService);
  Math = Math;

  private _properties = signal<PropertyResult[]>([]);

  // Form and state
  searchForm!: FormGroup;
  loading = signal(false);
  searchResults = signal<{ results: PropertyResult[]; total: number }>({
    results: [],
    total: 0,
  });
  totalResults = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  sortBy = signal<string>('relevance');
  sortOrder = signal<'asc' | 'desc'>('desc');
  showFilters = signal(false);

  // Search parameters
  searchParams: SearchParams = {
    page: 1,
    pageSize: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  };

  // Computed properties
  mappedProperties = computed(() => {
    return this._properties().map((p) => ({
      ...p,
    }));
  });

  ngOnInit() {
    this.initializeForm();
    this.setupRouteSubscription();
    this.performInitialSearch();
  }

  private initializeForm() {
    this.searchForm = this.fb.group({
      q: [''],
      property_type: [''],
      minPrice: [null],
      maxPrice: [null],
      bedrooms: [null],
      minBedrooms: [null],
      maxBedrooms: [null],
      minBathrooms: [null],
      maxBathrooms: [null],
      minArea: [null],
      maxArea: [null],
      hasElevator: [false],
      hasParking: [false],
      hasStorage: [false],
      hasBalcony: [false],
      city: [''],
      district: [''],
    });
  }

  private setupRouteSubscription() {
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchForm.patchValue({ q: params['q'] });
        this.searchParams.q = params['q'];
      }
      // Handle other query parameters if needed
    });
  }

  private async performInitialSearch() {
    await this.executeSearch();
  }

  async executeSearch() {
    try {
      this.loading.set(true);

      const searchParams: SearchParams = {
        q: this.searchForm.get('q')?.value || undefined,
        property_type: this.searchForm.get('property_type')?.value || undefined,
        bedrooms: this.searchForm.get('bedrooms')?.value || undefined,
        page: this.currentPage(),
        pageSize: this.pageSize(),
        sortBy: this.sortBy() as SortField,
        sortOrder: this.sortOrder(),
        minPrice: this.searchForm.get('minPrice')?.value || undefined,
        maxPrice: this.searchForm.get('maxPrice')?.value || undefined,
        minBedrooms: this.searchForm.get('minBedrooms')?.value || undefined,
        maxBedrooms: this.searchForm.get('maxBedrooms')?.value || undefined,
        minBathrooms: this.searchForm.get('minBathrooms')?.value || undefined,
        maxBathrooms: this.searchForm.get('maxBathrooms')?.value || undefined,
        minArea: this.searchForm.get('minArea')?.value || undefined,
        maxArea: this.searchForm.get('maxArea')?.value || undefined,
        hasElevator: this.searchForm.get('hasElevator')?.value || false,
        hasParking: this.searchForm.get('hasParking')?.value || false,
        hasStorage: this.searchForm.get('hasStorage')?.value || false,
        hasBalcony: this.searchForm.get('hasBalcony')?.value || false,
        city: this.searchForm.get('city')?.value || undefined,
        district: this.searchForm.get('district')?.value || undefined,
      };

      const data = await firstValueFrom(
        this.trpc.property.search.query(searchParams)
      );

      // Update the properties signal with the results
      this._properties.set(this.normalizePropertyData(data.results));
      this.searchResults.set({
        results: data.results,
        total: data.total,
      });
      this.totalResults.set(data.total);

      // Store properties in map service for quick lookup
      this.mapService.setProperties(this._properties());
    } catch (error) {
      console.error('Search failed:', error);
      this._properties.set([]);
      this.searchResults.set({ results: [], total: 0 });
      this.totalResults.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  // Helper function for pagination
  getPaginationPages(): (number | string)[] {
    const currentPage = this.currentPage();
    const totalPages = this.getTotalPages();
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // First pages
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Last pages
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // Middle pages
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }

    return pages;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalResults() / this.pageSize());
  }

  formatPriceRange(): string {
    const minPrice = this.searchForm.get('minPrice')?.value;
    const maxPrice = this.searchForm.get('maxPrice')?.value;

    if (!minPrice && !maxPrice) {
      return 'همه قیمت‌ها';
    }

    if (minPrice && maxPrice) {
      return `${this.formatPrice(minPrice)} - ${this.formatPrice(
        maxPrice
      )} تومان`;
    }

    if (minPrice) {
      return `از ${this.formatPrice(minPrice)} تومان`;
    }

    if (maxPrice) {
      return `تا ${this.formatPrice(maxPrice)} تومان`;
    }

    return 'همه قیمت‌ها';
  }

  scrollCardIntoView(propertyId: string | number) {
    const idStr = propertyId?.toString();
    if (!idStr) return;

    setTimeout(() => {
      const cardElement = document.querySelector(
        `[data-property-id="${idStr}"]`
      );
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        cardElement.classList.add('highlight-property');
        setTimeout(() => {
          cardElement.classList.remove('highlight-property');
        }, 2000);
      }
    }, 100);
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

  onPageChange(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage.set(page);
      this.executeSearch();
      // Scroll to top of results
      const resultsContainer = document.querySelector('.overflow-y-auto');
      if (resultsContainer) {
        resultsContainer.scrollTop = 0;
      }
    }
  }

  onSortChange(value: string | string[] | undefined) {
    // Handle undefined, single string, and array of strings
    if (!value) return;
    const sortValue = Array.isArray(value) ? value[0] : value;
    if (sortValue) {
      this.sortBy.set(sortValue);
      this.executeSearch();
    }
  }

  toggleFilters() {
    this.showFilters.update((value) => !value);
  }

  onFeatureChange(feature: string, checked: boolean | string) {
    // Ensure we have a proper boolean value
    const booleanValue = checked === true || checked === 'true';
    this.searchForm.get(feature)?.setValue(booleanValue);
    this.executeSearch();
  }

  onPropertyTypeChange(type: string, checked: boolean | string) {
    // Since we changed to single property_type instead of array, handle differently
    const booleanValue = checked === true || checked === 'true';
    if (booleanValue) {
      this.searchForm.get('property_type')?.setValue(type);
    } else {
      // If unchecking, clear the property type
      this.searchForm.get('property_type')?.setValue('');
    }
    this.executeSearch();
  }

  isPropertyTypeSelected(type: string): boolean {
    const selectedType = this.searchForm.get('property_type')?.value;
    return selectedType === type;
  }

  /**
   * Normalizes raw property data from API into PropertyResult objects
   * @param rawProperties The raw property data from the API
   * @returns An array of normalized PropertyResult objects
   */
  private normalizePropertyData(rawProperties: any[]): PropertyResult[] {
    if (!rawProperties || !Array.isArray(rawProperties)) {
      console.warn('Invalid raw properties data:', rawProperties);
      return [];
    }

    // Create a new array with normalized properties
    const normalizedProperties: PropertyResult[] = [];

    // Process each raw property
    for (const rawProperty of rawProperties) {
      // Skip null/undefined properties
      if (!rawProperty) continue;

      // Create normalized property object
      const normalized: PropertyResult = {
        id: rawProperty.id,
        external_id: rawProperty.external_id,
        title: rawProperty.title || 'Untitled Property',
        price: typeof rawProperty.price === 'number' ? rawProperty.price : 0,
        bedrooms: rawProperty.bedrooms,
        bathrooms: rawProperty.bathrooms,
        area: rawProperty.area,
        description: rawProperty.description,

        // Handle location properly
        location:
          rawProperty.location?.lat && rawProperty.location?.lon
            ? {
                lat: rawProperty.location.lat,
                lon: rawProperty.location.lon,
              }
            : undefined,

        // Handle images array
        images: Array.isArray(rawProperty.images)
          ? rawProperty.images
          : rawProperty.images
          ? [rawProperty.images]
          : [],

        // Location details
        district: rawProperty.district,
        city: rawProperty.city,

        // Property features
        property_type: rawProperty.property_type,
        has_elevator: rawProperty.has_elevator,
        has_parking: rawProperty.has_parking,
        has_storage: rawProperty.has_storage,
        has_balcony: rawProperty.has_balcony,

        // Analytics
        investment_score: rawProperty.investment_score,

        // Additional details for tooltips and info
        price_per_meter: rawProperty.price_per_meter,
        year_built: rawProperty.year_built,
      };

      // Add to normalized array
      normalizedProperties.push(normalized);
    }

    return normalizedProperties;
  }

  // Card and map interaction methods
  onCardHover(property: PropertyResult) {
    this.mapService.highlightProperty(property.id);
  }

  onCardClick(property: PropertyResult) {
    // Validate property
    if (!property) {
      console.error('Cannot navigate: Property is undefined');
      return;
    }

    // Log ID for debugging
    console.log(
      'Navigating to property with ID:',
      property.id,
      'Type:',
      typeof property.id
    );

    // Navigate to property details page
    this.router.navigate(['/properties', property.id]);
  }

  onMarkerClick(marker: any) {
    // Add logging
    console.log(
      'Marker clicked with ID:',
      marker.id,
      'Type:',
      typeof marker.id
    );

    if (marker && marker.id) {
      // Highlight the property using the MapService
      this.mapService.highlightProperty(marker.id);

      // Scroll the card into view
      this.scrollCardIntoView(marker.id);

      // Center map on marker if needed
      // This would be handled by the map component's onMarkerClick method
    }
  }

  // Navigate to property details
  viewPropertyDetails(propertyId: string | number) {
    if (propertyId) {
      this.router.navigate(['/properties', propertyId]);
    }
  }

  // Helper utilities
  findPropertyById(propertyId: string | number): PropertyResult | undefined {
    if (propertyId === null || propertyId === undefined) {
      return undefined;
    }

    // Get the properties directly from the signal
    const properties = this.mappedProperties();

    // Convert propertyId to string for comparison
    const idStr = propertyId.toString();

    // Find and return the matching property
    return properties.find((p) => p.id?.toString() === idStr);
  }

  toNumberOrUndefined(value: string | number | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }
}
