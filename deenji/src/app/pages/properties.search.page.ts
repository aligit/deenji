import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { injectTrpcClient } from '../../trpc-client';
import { PropertyResult } from '../core/types/property.types';

// UI Components
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

// Fix 1: Import HlmSelectImports only once from the correct module
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideFilter,
  lucideMapPin,
  lucideHouse,
  lucideBath,
  lucideBed,
  lucideMaximize,
  lucideChevronDown,
  lucideX,
  lucideSettings,
  lucideMap,
  lucideList,
} from '@ng-icons/lucide';

// Components
import { MapComponent } from '../core/components/map.component';
import { MapService } from '../core/services/map.service';

interface SearchParams {
  q?: string;
  property_type?: string; // Changed from propertyTypes to property_type to match API
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

// Fix 2: Update type assertion to match exactly what the API expects
type SortField = 'date' | 'price' | 'relevance' | 'area' | 'created_at';

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
    HlmSelectImports, // Only imported once
    MapComponent,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideFilter,
      lucideMapPin,
      lucideHouse,
      lucideBath,
      lucideBed,
      lucideMaximize,
      lucideChevronDown,
      lucideX,
      lucideSettings,
      lucideMap,
      lucideList,
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
                <ng-icon name="lucideFilter" size="16" class="ml-2" />
                فیلترها
              </button>
              <button hlmBtn variant="outline" (click)="toggleViewMode()">
                <ng-icon
                  [name]="viewMode() === 'list' ? 'lucideMap' : 'lucideList'"
                  size="16"
                  class="ml-2"
                />
                {{ viewMode() === 'list' ? 'نمایش نقشه' : 'نمایش لیست' }}
              </button>
            </div>

            <!-- Results Summary and Sort -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                {{ totalResults() }} ملک یافت شد
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">مرتب‌سازی:</span>
                <select
                  class="border border-gray-300 rounded px-2 py-1 text-sm"
                  [value]="sortBy()"
                  (change)="onSortChange($any($event.target).value)"
                >
                  <option value="relevance">مرتبط‌ترین</option>
                  <option value="price">قیمت</option>
                  <option value="date">تاریخ</option>
                  <option value="area">متراژ</option>
                  <option value="created_at">جدیدترین</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex gap-6">
          <!-- Filters Sidebar -->
          @if (showFilters()) {
          <div class="w-80 space-y-6">
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
                <select
                  class="w-full border border-gray-300 rounded px-3 py-2"
                  [formControl]="$any(searchForm.get('property_type'))"
                >
                  <option value="">همه انواع</option>
                  <option value="آپارتمان">آپارتمان</option>
                  <option value="خانه">خانه</option>
                  <option value="ویلا">ویلا</option>
                  <option value="زمین">زمین</option>
                </select>
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

              <!-- Property Types -->
              <div class="space-y-4">
                <h4 class="font-medium text-gray-800">نوع ملک</h4>

                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="isPropertyTypeSelected('apartment')"
                    (checkedChange)="onPropertyTypeChange('apartment', $event)"
                  />
                  <span>آپارتمان</span>
                </label>

                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="isPropertyTypeSelected('house')"
                    (checkedChange)="onPropertyTypeChange('house', $event)"
                  />
                  <span>خانه</span>
                </label>

                <label class="flex items-center space-x-2" hlmLabel>
                  <hlm-checkbox
                    class="ml-2"
                    [checked]="isPropertyTypeSelected('villa')"
                    (checkedChange)="onPropertyTypeChange('villa', $event)"
                  />
                  <span>ویلا</span>
                </label>
              </div>
            </div>
          </div>
          }

          <!-- Main Content Area -->
          <div class="flex-1">
            @if (viewMode() === 'list') {
            <!-- List View -->
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
            <!-- Property List -->
            <div class="space-y-4">
              @for (property of mappedProperties(); track property.id) {
              <div
                hlmCard
                class="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                [class.ring-2]="
                  mapService.highlightedPropertyId() === property.id
                "
                [class.ring-primary-500]="
                  mapService.highlightedPropertyId() === property.id
                "
                [attr.data-property-id]="property.id"
                (click)="onCardClick(property)"
              >
                <div class="flex gap-4 p-6">
                  <!-- Property Image -->
                  <div
                    class="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    @if (property.images && property.images.length > 0) {
                    <img
                      [src]="property.images[0]"
                      [alt]="property.title"
                      class="w-full h-full object-cover"
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
                  </div>

                  <!-- Property Details -->
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg text-gray-900 mb-2">
                      {{ property.title }}
                    </h3>

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
                    @if (property.district || property.city) {
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <ng-icon name="lucideMapPin" size="14" />
                      <span>{{ property.district || property.city }}</span>
                    </div>
                    }
                  </div>
                </div>
              </div>
              }
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
            } } @else {
            <!-- Map View -->
            <div class="h-[600px] rounded-lg overflow-hidden">
              <app-map
                [properties]="mappedProperties()"
                [highlightedPropertyId]="
                  toNumberOrUndefined(mapService.highlightedPropertyId())
                "
                (onMapClick)="onMarkerClick($event)"
              ></app-map>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
  private _properties = signal<PropertyResult[]>([]);

  // Form and search state
  searchForm!: FormGroup;

  // Signals
  loading = signal(false);
  searchResults = signal<{ results: PropertyResult[]; total: number }>({
    results: [],
    total: 0,
  });
  totalResults = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  sortBy = signal('relevance');
  sortOrder = signal<'asc' | 'desc'>('desc');
  viewMode = signal<'list' | 'map'>('list');
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
      property_type: [''], // Changed from propertyTypes array to single property_type
      minPrice: [null],
      maxPrice: [null],
      bedrooms: [null], // Single bedrooms field instead of min/max
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
    // Handle route parameters and query parameters
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchForm.patchValue({ q: params['q'] }); // Changed from 'query' to 'q'
        this.searchParams.q = params['q']; // Changed from 'query' to 'q'
      }
      // Handle other query parameters...
    });
  }

  private async performInitialSearch() {
    await this.executeSearch();
  }

  async executeSearch() {
    try {
      this.loading.set(true);

      // Build search parameters that match the API schema exactly
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
    } catch (error) {
      console.error('Search failed:', error);
      this._properties.set([]);
      this.searchResults.set({ results: [], total: 0 });
      this.totalResults.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  // Fix 3: Add proper null checking in formatPriceRange
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

  // Fixed: Properly handle string and number IDs
  scrollCardIntoView(propertyId: string | number) {
    const idStr = propertyId?.toString();
    if (!idStr) return;

    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const cardElement = document.querySelector(
        `[data-property-id="${idStr}"]`
      );
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Add a highlight effect
        cardElement.classList.add('highlight-property');
        setTimeout(() => {
          cardElement.classList.remove('highlight-property');
        }, 2000);
      }
    }, 100);
  }

  // Make formatPrice public so it can be used in template
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

  // Additional helper methods...
  onPageChange(page: number) {
    this.currentPage.set(page);
    this.executeSearch();
  }

  onSortChange(sortValue: string) {
    this.sortBy.set(sortValue);
    this.executeSearch();
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'list' ? 'map' : 'list');
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  // Checkbox event handlers for Spartan UI
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
      };

      // Add to normalized array
      normalizedProperties.push(normalized);
    }

    return normalizedProperties;
  }

  // Fixed: Properly handle navigation with string or number IDs
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

  // Fixed: Properly handle marker click with string or number IDs
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

      // Navigate to property details page
      this.router.navigate(['/properties', marker.id]);
    }
  }

  /**
   * Finds a property by ID in the mapped properties array
   * @param propertyId The ID of the property to find
   * @returns The found property or undefined
   */
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
