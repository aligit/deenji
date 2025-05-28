// src/app/pages/properties.search.page.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectTrpcClient } from '../../trpc-client';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import {
  BrnSelectImports,
  BrnSelectValueComponent,
  BrnSelectOptionDirective,
} from '@spartan-ng/brain/select';
import {
  HlmSelectImports,
  HlmSelectContentDirective,
  HlmSelectOptionComponent,
} from '@spartan-ng/ui-select-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import {
  HlmTooltipComponent,
  HlmTooltipTriggerDirective,
} from '@spartan-ng/ui-tooltip-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMapPin,
  lucideHouse,
  lucideBath,
  lucideBed,
  lucideMaximize,
  lucideChevronLeft,
  lucideChevronRight,
  lucideHeart,
  lucideShare2,
  lucideFilter,
  lucideX,
} from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { PropertySearchQuery } from '../../server/trpc/schemas/property.schema';

interface PropertyResult {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  price: number;
  price_per_meter?: number;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  year_built?: number;
  address?: string;
  district?: string;
  city?: string;
  has_elevator?: boolean;
  has_parking?: boolean;
  has_storage?: boolean;
  has_balcony?: boolean;
  investment_score?: number;
  images?: string[];
  location?: {
    lat: number;
    lon: number;
  };
  created_at?: string;
  updated_at?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmBadgeDirective,
    BrnSelectImports,
    HlmSelectImports,
    BrnSelectValueComponent,
    BrnSelectOptionDirective,
    HlmSelectContentDirective,
    HlmSelectOptionComponent,
    HlmSkeletonComponent,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
    BrnTooltipContentDirective,
    HlmIconDirective,
  ],
  providers: [
    provideIcons({
      lucideMapPin,
      lucideHouse,
      lucideBath,
      lucideBed,
      lucideMaximize,
      lucideChevronLeft,
      lucideChevronRight,
      lucideHeart,
      lucideShare2,
      lucideFilter,
      lucideX,
    }),
  ],
  template: `
    <div class="flex h-screen pt-16" dir="rtl">
      <!-- List Section -->
      <div class="w-1/2 flex flex-col bg-gray-50">
        <!-- Header with Filters -->
        <div class="bg-white border-b border-gray-200 p-4">
          <!-- Search Summary -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-xl font-bold text-gray-900">
                {{ searchResults()?.total || 0 }} ملک پیدا شد
              </h1>
              <div class="flex flex-wrap gap-2 mt-2">
                @if (searchParams.property_type) {
                <span
                  class="inline-flex items-center bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full"
                >
                  {{ searchParams.property_type }}
                  <button class="mr-1" (click)="removeFilter('property_type')">
                    <ng-icon
                      hlm
                      name="lucideX"
                      size="default"
                      class="w-3 h-3"
                    />
                  </button>
                </span>
                } @if (searchParams.minBedrooms) {
                <span
                  class="inline-flex items-center bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full"
                >
                  {{ searchParams.minBedrooms }} خوابه
                  <button class="mr-1" (click)="removeFilter('minBedrooms')">
                    <ng-icon
                      hlm
                      name="lucideX"
                      size="default"
                      class="w-3 h-3"
                    />
                  </button>
                </span>
                } @if (searchParams.minPrice || searchParams.maxPrice) {
                <span
                  class="inline-flex items-center bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full"
                >
                  {{ formatPriceRange() }}
                  <button class="mr-1" (click)="removeFilter('price')">
                    <ng-icon
                      hlm
                      name="lucideX"
                      size="default"
                      class="w-3 h-3"
                    />
                  </button>
                </span>
                }
              </div>
            </div>

            <!-- Sort Dropdown -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-600">مرتب‌سازی:</span>
              <brn-select
                [(ngModel)]="sortBy"
                (ngModelChange)="onSortChange()"
                placeholder="انتخاب کنید"
              >
                <hlm-select-trigger class="w-48">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content>
                  <hlm-option value="relevance">مرتبط‌ترین</hlm-option>
                  <hlm-option value="price-asc">قیمت: کم به زیاد</hlm-option>
                  <hlm-option value="price-desc">قیمت: زیاد به کم</hlm-option>
                  <hlm-option value="newest">جدیدترین</hlm-option>
                  <hlm-option value="area-desc">متراژ: زیاد به کم</hlm-option>
                </hlm-select-content>
              </brn-select>
            </div>
          </div>
        </div>

        <!-- Results List -->
        <div class="flex-1 overflow-y-auto">
          @if (loading()) {
          <!-- Loading Skeletons -->
          <div class="p-4 space-y-4">
            @for (item of [1, 2, 3, 4]; track item) {
            <div hlmCard class="overflow-hidden">
              <div class="flex">
                <hlm-skeleton class="w-48 h-36" />
                <div class="flex-1 p-4 space-y-3">
                  <hlm-skeleton class="h-6 w-3/4" />
                  <hlm-skeleton class="h-8 w-1/2" />
                  <hlm-skeleton class="h-4 w-full" />
                  <hlm-skeleton class="h-4 w-2/3" />
                </div>
              </div>
            </div>
            }
          </div>
          } @else if (error()) {
          <!-- Error State -->
          <div class="p-8 text-center">
            <div
              class="bg-red-50 border border-red-200 rounded-lg p-6 inline-block"
            >
              <h2 class="text-xl font-semibold text-red-800 mb-2">
                خطا در جستجو
              </h2>
              <p class="text-red-700">{{ error() }}</p>
              <button
                hlmBtn
                variant="outline"
                class="mt-4"
                (click)="executeSearch()"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
          } @else if (searchResults()?.results &&
          searchResults()!.results.length > 0) {
          <!-- Property Cards -->
          <div class="p-4 space-y-4">
            @for (property of searchResults()!.results; track property.id) {
            <hlm-tooltip>
              <div
                hlmTooltipTrigger
                hlmCard
                class="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
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
                        hlm
                        name="lucideHouse"
                        size="lg"
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
                        hlm
                        name="lucideHeart"
                        size="default"
                        class="w-4 h-4 text-gray-600"
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
                          hlm
                          name="lucideShare2"
                          size="default"
                          class="w-4 h-4 text-gray-500"
                        />
                      </button>
                    </div>

                    <!-- Price -->
                    <div class="text-2xl font-bold text-primary-600 mb-3">
                      {{ formatPrice(property.price) }} تومان
                    </div>

                    <!-- Specs -->
                    <div
                      class="flex items-center gap-4 text-sm text-gray-600 mb-3"
                    >
                      @if (property.bedrooms) {
                      <div class="flex items-center gap-1">
                        <ng-icon
                          hlm
                          name="lucideBed"
                          size="default"
                          class="w-4 h-4"
                        />
                        <span>{{ property.bedrooms }} خواب</span>
                      </div>
                      } @if (property.bathrooms) {
                      <div class="flex items-center gap-1">
                        <ng-icon
                          hlm
                          name="lucideBath"
                          size="default"
                          class="w-4 h-4"
                        />
                        <span>{{ property.bathrooms }} حمام</span>
                      </div>
                      } @if (property.area) {
                      <div class="flex items-center gap-1">
                        <ng-icon
                          hlm
                          name="lucideMaximize"
                          size="default"
                          class="w-4 h-4"
                        />
                        <span>{{ property.area }} متر</span>
                      </div>
                      }
                    </div>

                    <!-- Location -->
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <ng-icon
                        hlm
                        name="lucideMapPin"
                        size="default"
                        class="w-4 h-4"
                      />
                      <span>{{
                        property.district || property.city || 'تهران'
                      }}</span>
                    </div>

                    <!-- Features -->
                    <div class="flex gap-2 mt-3">
                      @if (property.has_parking) {
                      <span hlmBadge variant="outline">پارکینگ</span>
                      } @if (property.has_elevator) {
                      <span
                        hlmBadge
                        variant="outline"
                        size="default"
                        class="w-4 h-4"
                        >آسانسور</span
                      >
                      } @if (property.has_balcony) {
                      <span
                        hlmBadge
                        variant="outline"
                        size="default"
                        class="w-4 h-4"
                        >بالکن</span
                      >
                      } @if (property.has_storage) {
                      <span
                        hlmBadge
                        variant="outline"
                        size="default"
                        class="w-4 h-4"
                        >انباری</span
                      >
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
          <div class="border-t border-gray-200 bg-white p-4">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                نمایش {{ (currentPage() - 1) * pageSize + 1 }} تا
                {{ Math.min(currentPage() * pageSize, searchResults()!.total) }}
                از {{ searchResults()!.total }} نتیجه
              </div>

              <div class="flex items-center gap-2">
                <button
                  hlmBtn
                  variant="outline"
                  size="default"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                >
                  <ng-icon
                    hlm
                    name="lucideChevronRight"
                    size="default"
                    class="w-4 h-4"
                  />
                  قبلی
                </button>

                <div class="flex items-center gap-1">
                  @for (page of paginationPages(); track page) { @if (page ===
                  '...') {
                  <span class="px-2">...</span>
                  } @else {
                  <button
                    hlmBtn
                    [variant]="page === currentPage() ? 'default' : 'outline'"
                    size="default"
                    (click)="goToPage(page)"
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
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                >
                  بعدی
                  <ng-icon
                    hlm
                    name="lucideChevronLeft"
                    size="default"
                    class="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>
          } @else {
          <!-- No Results -->
          <div class="p-8 text-center">
            <div class="inline-block">
              <ng-icon
                hlm
                name="lucideHouse"
                size="lg"
                class="w-8 h-8 text-gray-300 mb-4"
              />
              <p class="text-gray-500 text-lg">
                هیچ ملکی با این مشخصات یافت نشد
              </p>
              <button
                hlmBtn
                variant="outline"
                class="mt-4"
                (click)="clearFilters()"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Map Section (Placeholder) -->
      <div class="w-1/2 relative bg-gray-100">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <ng-icon
              hlm
              name="lucideMapPin"
              size="lg"
              class="text-gray-400 mb-4"
            />
            <p class="text-gray-500 text-lg">نقشه در حال بارگذاری...</p>
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
    `,
  ],
})
export default class PropertiesSearchPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _trpc = injectTrpcClient();
  Math = Math;

  // Signals
  loading = signal(true);
  error = signal<string | null>(null);
  searchResults = signal<{ results: PropertyResult[]; total: number } | null>(
    null
  );
  currentPage = signal(1);
  sortBy = signal('relevance');

  // Constants
  pageSize = 20;

  // Computed values
  totalPages = computed(() => {
    const results = this.searchResults();
    if (!results) return 1;
    return Math.ceil(results.total / this.pageSize);
  });

  paginationPages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }

    return pages;
  });

  searchParams: Partial<PropertySearchQuery> = {};

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.searchParams = {
        property_type: params['propertyType'],
        minBedrooms: params['bedrooms']
          ? parseInt(params['bedrooms'])
          : undefined,
        maxBedrooms: params['bedrooms']
          ? parseInt(params['bedrooms'])
          : undefined,
        minPrice: params['minPrice'] ? parseInt(params['minPrice']) : undefined,
        maxPrice: params['maxPrice'] ? parseInt(params['maxPrice']) : undefined,
      };

      // Reset to page 1 when filters change
      this.currentPage.set(1);
      this.executeSearch();
    });
  }

  executeSearch() {
    this.loading.set(true);
    this.error.set(null);

    const [sortField, sortDirection] = this.sortBy().split('-');

    const searchQuery: PropertySearchQuery = {
      property_type: this.searchParams.property_type,
      minBedrooms: this.searchParams.minBedrooms,
      maxBedrooms: this.searchParams.maxBedrooms,
      minPrice: this.searchParams.minPrice,
      maxPrice: this.searchParams.maxPrice,
      page: this.currentPage(),
      pageSize: this.pageSize,
      sortBy: sortField as 'date' | 'price' | 'relevance',
      sortOrder: sortDirection === 'asc' ? 'asc' : 'desc',
    };

    this._trpc.property.search.query(searchQuery).subscribe({
      next: (data) => {
        console.log('Search results:', data);

        const results: PropertyResult[] = data.results.map((item) => ({
          ...item,
          id: item.id != null ? item.id.toString() : '',
          property_type: item.type ?? '',
          // now images is already string[], so just use it
          images: item.images ?? [],
        }));

        this.searchResults.set({ results, total: data.total });
      },
      error: (err) => {
        console.error('Search error:', err);
        this.error.set('خطا در جستجوی املاک. لطفاً دوباره تلاش کنید.');
      },
      complete: () => this.loading.set(false),
    });
  }

  onSortChange() {
    this.executeSearch();
  }

  goToPage(page: number | string) {
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

  removeFilter(filterType: string) {
    const updatedParams = { ...this.searchParams };

    if (filterType === 'property_type') {
      delete updatedParams.property_type;
    } else if (filterType === 'minBedrooms') {
      delete updatedParams.minBedrooms;
    } else if (filterType === 'price') {
      delete updatedParams.minPrice;
      delete updatedParams.maxPrice;
    }

    this.router.navigate([], {
      queryParams: updatedParams,
      queryParamsHandling: 'merge',
    });
  }

  clearFilters() {
    this.router.navigate([], {
      queryParams: {},
    });
  }

  formatPrice(price: number): string {
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد`;
    } else if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(0)} میلیون`;
    }
    return price.toLocaleString('fa-IR');
  }

  formatPriceRange(): string {
    if (this.searchParams.minPrice && this.searchParams.maxPrice) {
      return `بین ${this.formatPrice(
        this.searchParams.minPrice
      )} تا ${this.formatPrice(this.searchParams.maxPrice)}`;
    } else if (this.searchParams.minPrice) {
      return `حداقل ${this.formatPrice(this.searchParams.minPrice)}`;
    } else if (this.searchParams.maxPrice) {
      return `تا ${this.formatPrice(this.searchParams.maxPrice)}`;
    }
    return 'همه قیمت‌ها';
  }
}
