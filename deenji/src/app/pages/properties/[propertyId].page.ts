// src/app/pages/properties/[propertyId].page.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { injectTrpcClient } from '../../../trpc-client';

// UI Components
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { BrnSeparatorComponent } from '@spartan-ng/brain/separator';
import {
  HlmTooltipComponent,
  HlmTooltipTriggerDirective,
} from '@spartan-ng/ui-tooltip-helm';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';

// Icons
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMapPin,
  lucideHouse,
  lucideBath,
  lucideBed,
  lucideMaximize,
  lucideCalendar,
  lucidePhone,
  lucideMail,
  lucideShare2,
  lucideHeart,
  lucideArrowLeft,
  lucideChevronsUpDown,
  lucideCar,
  lucideWarehouse,
  lucideFlower,
  lucideTrendingUp,
  lucideChartBar,
  lucideChevronLeft,
  lucideChevronRight,
  lucideExpand,
  lucideBuilding,
  lucideKey,
  lucideShield,
  lucideRefreshCw,
  lucideRuler,
} from '@ng-icons/lucide';

import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';

import { SimilarPropertiesComponent } from '../../core/components/similar-properties.component';
import { PropertyValueIndicatorComponent } from '../../core/components/property-value-indicator.component';
import { PriceTrendChartComponent } from '../../core/components/price-trend-chart.component';
import { PropertyReviewsComponent } from '../../core/components/property-reviews.component';
import { PropertyDetail } from '../../core/types/property.types';
import { MapComponent } from '../../core/components/map.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    HlmCardDirective,
    HlmButtonDirective,
    HlmSkeletonComponent,
    HlmBadgeDirective,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
    BrnTooltipContentDirective,
    GalleryModule,
    LightboxModule,
    SimilarPropertiesComponent,
    RouterLink,
    PropertyValueIndicatorComponent,
    PriceTrendChartComponent,
    PropertyReviewsComponent,
    MapComponent,
  ],
  providers: [
    provideIcons({
      lucideMapPin,
      lucideHouse,
      lucideBath,
      lucideBed,
      lucideMaximize,
      lucideCalendar,
      lucidePhone,
      lucideMail,
      lucideShare2,
      lucideHeart,
      lucideArrowLeft,
      lucideChevronsUpDown,
      lucideCar,
      lucideWarehouse,
      lucideFlower,
      lucideTrendingUp,
      lucideChartBar,
      lucideChevronLeft,
      lucideChevronRight,
      lucideExpand,
      lucideBuilding,
      lucideKey,
      lucideShield,
      lucideRefreshCw,
      lucideRuler,
    }),
  ],
  template: `
    <div class="min-h-screen bg-gray-50" dir="rtl">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <button
              hlmBtn
              variant="ghost"
              size="sm"
              (click)="goBack()"
              class="flex items-center gap-2"
            >
              <ng-icon name="lucideArrowLeft" size="16" />
              بازگشت به نتایج
            </button>

            <div class="flex items-center gap-2">
              <button hlmBtn variant="outline" size="sm">
                <ng-icon name="lucideShare2" size="16" />
                اشتراک‌گذاری
              </button>
              <button hlmBtn variant="outline" size="sm">
                <ng-icon name="lucideHeart" size="16" />
                ذخیره
              </button>
            </div>
          </div>
        </div>
      </header>

      @if (loading()) {
      <!-- Loading State -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <hlm-skeleton class="w-full h-96 rounded-lg mb-6" />
            <hlm-skeleton class="h-8 w-3/4 mb-4" />
            <hlm-skeleton class="h-6 w-1/2 mb-6" />
            <div class="grid grid-cols-2 gap-4 mb-6">
              <hlm-skeleton class="h-20" />
              <hlm-skeleton class="h-20" />
              <hlm-skeleton class="h-20" />
              <hlm-skeleton class="h-20" />
            </div>
          </div>
          <div>
            <hlm-skeleton class="h-64" />
          </div>
        </div>
      </div>
      } @else if (error()) {
      <!-- Error State -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <ng-icon
            name="lucideHouse"
            size="48"
            class="mx-auto text-gray-400 mb-4"
          />
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            خطا در بارگذاری ملک
          </h2>
          <p class="text-gray-600 mb-6">{{ error() }}</p>
          <button hlmBtn (click)="retry()">تلاش مجدد</button>
        </div>
      </div>
      } @else if (property()) {
      <!-- Property Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Image Gallery -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
              @if (property()?.images && property()!.images!.length > 0) {
              <div class="relative">
                <div class="aspect-w-16 aspect-h-9">
                  <img
                    [src]="property()!.images![0]"
                    [alt]="property()!.title"
                    class="w-full h-96 object-cover cursor-pointer"
                    (click)="openGallery(0)"
                  />
                </div>

                @if (property()!.images!.length > 1) {
                <div class="absolute bottom-4 right-4">
                  <button
                    hlmBtn
                    variant="secondary"
                    size="sm"
                    (click)="openGallery(0)"
                    class="bg-black/70 text-white hover:bg-black/80"
                  >
                    <ng-icon name="lucideExpand" size="16" class="ml-2" />
                    مشاهده تمام تصاویر ({{ property()!.images!.length }})
                  </button>
                </div>
                } @if (property()!.images!.length > 1) {
                <div class="grid grid-cols-4 gap-2 mt-4 p-4">
                  @for (image of property()!.images!.slice(1, 5); track image;
                  let i = $index) {
                  <div
                    class="aspect-square cursor-pointer relative overflow-hidden rounded-lg"
                    (click)="openGallery(i + 1)"
                  >
                    <img
                      [src]="image"
                      [alt]="property()!.title + ' - تصویر ' + (i + 2)"
                      class="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    @if (i === 3 && property()!.images!.length > 5) {
                    <div
                      class="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <span class="text-white font-medium">
                        +{{ property()!.images!.length - 5 }} تصویر دیگر
                      </span>
                    </div>
                    }
                  </div>
                  }
                </div>
                }
              </div>
              } @else {
              <!-- No Images Placeholder -->
              <div class="h-96 bg-gray-100 flex items-center justify-center">
                <div class="text-center">
                  <ng-icon
                    name="lucideHouse"
                    size="48"
                    class="text-gray-400 mx-auto mb-4"
                  />
                  <p class="text-gray-500">تصویری برای این ملک موجود نیست</p>
                </div>
              </div>
              }
            </div>

            <!-- Property Info -->
            <div hlmCard class="p-6">
              <h1 class="text-3xl font-bold text-gray-900 mb-4">
                {{ property()!.title }}
              </h1>

              <!-- Price -->
              <div class="bg-primary-50 rounded-lg p-4 mb-6">
                <div class="flex items-baseline justify-between">
                  <div>
                    <span class="text-3xl font-bold text-primary-700">
                      {{ formatPrice(property()!.price) }}
                    </span>
                    <span class="text-primary-600 mr-2">تومان</span>
                  </div>
                  @if (property()?.price_per_meter) {
                  <div class="text-sm text-gray-600">
                    {{ formatPricePerMeter(property()?.price_per_meter) }} / متر
                    مربع
                  </div>
                  }
                </div>
              </div>

              <!-- Key Features -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                @if (property()?.bedrooms) {
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <ng-icon
                    name="lucideBed"
                    size="24"
                    class="mx-auto text-gray-600 mb-2"
                  />
                  <div class="font-semibold text-gray-900">
                    {{ property()!.bedrooms }}
                  </div>
                  <div class="text-sm text-gray-600">خوابخانه</div>
                </div>
                } @if (property()?.bathrooms) {
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <ng-icon
                    name="lucideBath"
                    size="24"
                    class="mx-auto text-gray-600 mb-2"
                  />
                  <div class="font-semibold text-gray-900">
                    {{ property()!.bathrooms }}
                  </div>
                  <div class="text-sm text-gray-600">سرویس</div>
                </div>
                } @if (property()?.area) {
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <ng-icon
                    name="lucideMaximize"
                    size="24"
                    class="mx-auto text-gray-600 mb-2"
                  />
                  <div class="font-semibold text-gray-900">
                    {{ property()!.area }}
                  </div>
                  <div class="text-sm text-gray-600">متر مربع</div>
                </div>
                } @if (property()?.year_built) {
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <ng-icon
                    name="lucideCalendar"
                    size="24"
                    class="mx-auto text-gray-600 mb-2"
                  />
                  <div class="font-semibold text-gray-900">
                    {{ convertToSolarYear(property()!.year_built!) }}
                  </div>
                  <div class="text-sm text-gray-600">سال ساخت</div>
                </div>
                }
              </div>

              <!-- Property Features -->
              @if (hasAnyFeatures(property()!)) {
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  امکانات
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  @if (property()?.has_elevator) {
                  <div
                    class="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3"
                  >
                    <ng-icon name="lucideChevronsUpDown" size="18" />
                    <span>آسانسور</span>
                  </div>
                  } @if (property()?.has_parking) {
                  <div
                    class="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3"
                  >
                    <ng-icon name="lucideCar" size="18" />
                    <span>پارکینگ</span>
                  </div>
                  } @if (property()?.has_storage) {
                  <div
                    class="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3"
                  >
                    <ng-icon name="lucideWarehouse" size="18" />
                    <span>انباری</span>
                  </div>
                  } @if (property()?.has_balcony) {
                  <div
                    class="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3"
                  >
                    <ng-icon name="lucideFlower" size="18" />
                    <span>بالکن</span>
                  </div>
                  }
                </div>
              </div>
              }

              <!-- Property Value Indicator -->
              @if(estimatedValue()){
              <div hlmCard class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  ارزش ملک
                </h3>
                <app-property-value-indicator
                  [estimatedValue]="estimatedValue()?.estimatedValue"
                  [minPrice]="estimatedValue()?.priceRangeMin"
                  [maxPrice]="estimatedValue()?.priceRangeMax"
                  [rentEstimate]="estimatedValue()?.rentEstimate"
                ></app-property-value-indicator>
              </div>
              }

              <!-- Price Trend Chart -->
              @if(priceHistory().length > 0){
              <div hlmCard class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  تاریخچه قیمت
                </h3>
                <app-price-trend-chart
                  [priceHistory]="priceHistory()"
                ></app-price-trend-chart>
              </div>
              }

              <!-- Investment Score -->
              @if (property()?.investment_score) {
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  امتیاز سرمایه‌گذاری
                </h3>
                <div
                  class="bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg p-4"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <ng-icon
                        name="lucideTrendingUp"
                        size="20"
                        class="text-green-600"
                      />
                      <span class="font-medium">امتیاز کلی</span>
                    </div>
                    <span class="text-2xl font-bold text-green-700">
                      {{ property()!.investment_score }}/100
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-green-600 h-2 rounded-full transition-all duration-500"
                      [style.width.%]="property()!.investment_score"
                    ></div>
                  </div>
                </div>
              </div>
              }

              <!-- Description -->
              @if (property()?.description) {
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  توضیحات
                </h3>
                <div class="prose prose-sm max-w-none text-gray-700">
                  <p class="leading-relaxed whitespace-pre-line">
                    {{ property()!.description }}
                  </p>
                </div>
              </div>
              }
            </div>

            <!-- Map Section -->
            @if (property()?.location?.lat && property()!.location!.lon &&
            property()!.location!.lat !== 0 && property()!.location!.lon !== 0)
            {
            <div hlmCard class="p-6">
              @if (property()?.location?.lat && property()!.location!.lon) {
              <div hlmCard class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  موقعیت مکانی
                </h3>
                <div class="h-64 rounded-lg overflow-hidden">
                  <app-map
                    [properties]="[property()!]"
                    [highlightedPropertyId]="getNumericPropertyId()"
                  ></app-map>
                </div>
              </div>
              }
            </div>
            } @else {
            <!-- Address without map -->
            @if (property()?.address || property()?.location?.city) {
            <div hlmCard class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">آدرس</h3>
              <div class="flex items-center gap-2">
                <ng-icon name="lucideMapPin" size="20" class="text-gray-400" />
                <span class="text-gray-600">
                  {{
                    property()?.address ||
                      property()?.location?.city ||
                      'آدرس مشخص نشده'
                  }}
                </span>
              </div>
            </div>
            } }

            <!-- Reviews Section -->
            <brn-separator hlmSeparator class="my-8" />

            <app-property-reviews [propertyId]="getPropertyIdForReviews()" />

            <!-- Similar Properties Section -->
            <app-similar-properties
              [propertyId]="getNumericPropertyId()"
              [limit]="4"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Contact Card -->
            <div hlmCard class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                تماس با مشاور
              </h3>

              @if (property()?.agent_name) {
              <div class="mb-2">
                <span class="text-sm text-gray-600">مشاور: </span>
                <span class="font-medium">{{ property()?.agent_name }}</span>
              </div>
              } @if (property()?.agency_name) {
              <div class="mb-4">
                <span class="text-sm text-gray-600">آژانس: </span>
                <span class="font-medium">{{ property()?.agency_name }}</span>
              </div>
              }

              <div class="space-y-3">
                <button hlmBtn class="w-full" size="lg">
                  <ng-icon name="lucidePhone" size="18" class="ml-2" />
                  تماس تلفنی
                </button>

                <button hlmBtn variant="outline" class="w-full" size="lg">
                  <ng-icon name="lucideMail" size="18" class="ml-2" />
                  ارسال پیام
                </button>
              </div>

              <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-800">
                  برای مشاهده اطلاعات تماس، ابتدا وارد حساب کاربری خود شوید.
                </p>
              </div>
            </div>

            <!-- Enhanced Property Summary -->
            <div hlmCard class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                خلاصه ملک
              </h3>
              <div class="space-y-3 text-sm">
                @if (property()?.property_type) {
                <div class="flex justify-between">
                  <span class="text-gray-600">نوع ملک:</span>
                  <span class="font-medium">{{
                    property()!.property_type
                  }}</span>
                </div>
                }

                <div class="flex justify-between">
                  <span class="text-gray-600">قیمت:</span>
                  <span class="font-medium"
                    >{{ formatPrice(property()!.price) }} تومان</span
                  >
                </div>

                @if (property()?.price_per_meter) {
                <div class="flex justify-between">
                  <span class="text-gray-600">قیمت هر متر:</span>
                  <span class="font-medium"
                    >{{
                      formatPricePerMeter(property()!.price_per_meter!)
                    }}
                    تومان</span
                  >
                </div>
                } @if (property()?.area) {
                <div class="flex justify-between">
                  <span class="text-gray-600">متراژ:</span>
                  <span class="font-medium"
                    >{{ property()!.area }} متر مربع</span
                  >
                </div>
                } @if (property()?.bedrooms) {
                <div class="flex justify-between">
                  <span class="text-gray-600">تعداد خواب:</span>
                  <span class="font-medium">{{ property()!.bedrooms }}</span>
                </div>
                } @if (property()?.bathrooms) {
                <div class="flex justify-between">
                  <span class="text-gray-600">تعداد سرویس:</span>
                  <span class="font-medium">{{ property()!.bathrooms }}</span>
                </div>
                } @if (property()?.year_built) {
                <div class="flex justify-between">
                  <span class="text-gray-600">سال ساخت:</span>
                  <span class="font-medium">{{
                    convertToSolarYear(property()!.year_built!)
                  }}</span>
                </div>
                } @if (property()?.floor_info) {
                <div class="flex justify-between">
                  <span class="text-gray-600">طبقه:</span>
                  <span class="font-medium">{{ property()!.floor_info }}</span>
                </div>
                } @if (property()?.title_deed_type) {
                <div class="flex justify-between">
                  <span class="text-gray-600">نوع سند:</span>
                  <span class="font-medium">{{
                    property()!.title_deed_type
                  }}</span>
                </div>
                } @if (property()?.renovation_status) {
                <div class="flex justify-between">
                  <span class="text-gray-600">وضعیت بازسازی:</span>
                  <span class="font-medium">{{
                    property()!.renovation_status
                  }}</span>
                </div>
                }

                <!-- Facilities Summary -->
                @if (hasAnyFeatures(property()!)) {
                <div class="border-t pt-3 mt-3">
                  <span class="text-gray-600 block mb-2">امکانات:</span>
                  <div class="flex flex-wrap gap-1">
                    @if (property()?.has_parking) {
                    <span hlmBadge variant="secondary" class="text-xs"
                      >پارکینگ</span
                    >
                    } @if (property()?.has_storage) {
                    <span hlmBadge variant="secondary" class="text-xs"
                      >انباری</span
                    >
                    } @if (property()?.has_elevator) {
                    <span hlmBadge variant="secondary" class="text-xs"
                      >آسانسور</span
                    >
                    } @if (property()?.has_balcony) {
                    <span hlmBadge variant="secondary" class="text-xs"
                      >بالکن</span
                    >
                    }
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      }
    </div>

    <!-- Gallery Modal -->
    @if (showImageModal() && property()?.images && property()!.images!.length >
    0) {
    <div
      class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      (click)="closeImageModal()"
    >
      <div
        class="relative max-w-4xl max-h-full"
        (click)="$event.stopPropagation()"
      >
        <img
          [src]="property()!.images![currentImageIndex()]"
          [alt]="property()!.title"
          class="max-w-full max-h-full object-contain"
        />

        <!-- Navigation buttons -->
        @if (property()!.images!.length > 1) {
        <button
          hlmBtn
          variant="secondary"
          size="sm"
          class="absolute left-4 top-1/2 transform -translate-y-1/2"
          (click)="prevImage()"
          [disabled]="currentImageIndex() === 0"
        >
          <ng-icon name="lucideChevronLeft" size="20" />
        </button>

        <button
          hlmBtn
          variant="secondary"
          size="sm"
          class="absolute right-4 top-1/2 transform -translate-y-1/2"
          (click)="nextImage()"
          [disabled]="currentImageIndex() === property()!.images!.length - 1"
        >
          <ng-icon name="lucideChevronRight" size="20" />
        </button>
        }

        <!-- Close button -->
        <button
          hlmBtn
          variant="secondary"
          size="sm"
          class="absolute top-4 right-4"
          (click)="closeImageModal()"
        >
          ✕
        </button>

        <!-- Image counter -->
        @if (property()!.images!.length > 1) {
        <div
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded"
        >
          {{ currentImageIndex() + 1 }} / {{ property()!.images!.length }}
        </div>
        }
      </div>
    </div>
    }
  `,
  styles: [
    `
      .aspect-w-16 {
        position: relative;
        padding-bottom: 56.25%; /* 16:9 */
      }
      .aspect-w-16 > * {
        position: absolute;
        height: 100%;
        width: 100%;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }

      .prose p {
        white-space: pre-line;
      }

      .whitespace-pre-line {
        white-space: pre-line;
      }
    `,
  ],
})
export default class PropertyDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private trpc = injectTrpcClient();
  private router = inject(Router);

  propertyId = signal<string | number | null>(null);
  property = signal<PropertyDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showImageModal = signal<boolean>(false);
  currentImageIndex = signal<number>(0);
  estimatedValue = signal<{
    estimatedValue: number;
    priceRangeMin: number;
    priceRangeMax: number;
    rentEstimate: number;
  } | null>(null);
  priceHistory = signal<{ date: string; price: number }[]>([]);

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('propertyId');

      if (!id) {
        this.error.set('Property ID not found');
        this.loading.set(false);
        return;
      }

      this.propertyId.set(id);
      this.loadPropertyDetails(id);
    });
  }

  /**
   * Load property details from the API
   */
  private async loadPropertyDetails(propertyId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      //TODO: suggested by LLM w/o knowledge of my codebase
      const [propertyData, estimatedValueData, priceHistoryData] =
        await Promise.all([
          firstValueFrom(this.trpc.property.getById.query({ id: propertyId })),
          firstValueFrom(
            this.trpc.property.getEstimatedValue.query({ id: propertyId })
          ),
          firstValueFrom(
            this.trpc.property.getPriceHistory.query({ id: propertyId })
          ),
        ]);

      // Get raw property data from API
      const apiProperty: any = await firstValueFrom(
        this.trpc.property.getById.query({ id: propertyId })
      );

      console.log('Raw API property data:', apiProperty);
      const coords = apiProperty.location?.coordinates;
      const rawLat = coords?.lat ?? apiProperty.location?.lat;
      const rawLon = coords?.lon ?? apiProperty.location?.lon;
      const location =
        rawLat != null && rawLon != null
          ? { lat: rawLat, lon: rawLon, city: apiProperty.location?.city }
          : undefined;

      // Convert values to proper types as needed
      const propertyDetail: PropertyDetail = {
        // Basic properties
        id: apiProperty.id,
        external_id: apiProperty.external_id,
        title: apiProperty.title || '',
        price: Number(apiProperty.price),
        description: apiProperty.description,

        // Include address and price_per_meter
        address: apiProperty.address,
        price_per_meter: apiProperty.price_per_meter
          ? Number(apiProperty.price_per_meter)
          : undefined,

        // Other basic properties
        bedrooms: apiProperty.bedrooms
          ? Number(apiProperty.bedrooms)
          : undefined,
        bathrooms: apiProperty.bathrooms
          ? Number(apiProperty.bathrooms)
          : undefined,
        area: apiProperty.area ? Number(apiProperty.area) : undefined,

        // Location
        location,

        // Fixed: Map image_urls from Elasticsearch to images for frontend
        images: apiProperty.image_urls || apiProperty.images || [],

        // Location information
        district: apiProperty.district,
        city: apiProperty.city || apiProperty.location?.city,

        // Property features
        has_elevator: Boolean(apiProperty.has_elevator),
        has_parking: Boolean(apiProperty.has_parking),
        has_storage: Boolean(apiProperty.has_storage),
        has_balcony: Boolean(apiProperty.has_balcony),

        // Investment
        investment_score: apiProperty.investment_score
          ? Number(apiProperty.investment_score)
          : undefined,

        // Additional detail properties from Elasticsearch
        agent_name: apiProperty.agent_name,
        agency_name: apiProperty.agency_name,
        property_type: apiProperty.property_type || apiProperty.type,
        year_built: apiProperty.year_built
          ? Number(apiProperty.year_built)
          : undefined,

        // New fields from Elasticsearch response
        floor_info: apiProperty.floor_info,
        title_deed_type: apiProperty.title_deed_type,
        renovation_status: apiProperty.renovation_status,
      };

      console.log('Processed property detail:', propertyDetail);

      // Update property signal
      this.property.set(propertyDetail);
      this.estimatedValue.set(estimatedValueData);
      this.priceHistory.set(priceHistoryData);
      this.loading.set(false);
    } catch (err) {
      console.error(`Error loading property with ID "${propertyId}":`, err);
      this.error.set('Failed to load property details');
      this.loading.set(false);
    }
  }

  // Convert Hijri solar year to display format
  convertToSolarYear(year: number): string {
    // If year is already in solar format (1400+), return as is
    // If year is in Gregorian format (2000+), convert
    if (year > 2000) {
      return (year - 621).toString();
    }
    return year.toString();
  }

  // Format price with Persian numerals
  formatPrice(price: number | undefined): string {
    if (!price) return 'قیمت نامشخص';

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

    return `${price.toLocaleString('fa-IR')}`;
  }

  // Format price per meter
  formatPricePerMeter(price: number | undefined): string {
    if (!price) return 'قیمت نامشخص';

    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      return millions % 1 === 0
        ? `${millions} میلیون`
        : `${millions.toFixed(1)} میلیون`;
    }

    return `${price.toLocaleString('fa-IR')}`;
  }

  goBack(): void {
    this.router.navigate(['/properties']);
  }

  retry(): void {
    if (this.propertyId()) {
      this.loadPropertyDetails(this.propertyId()!.toString());
    }
  }

  openGallery(index: number): void {
    this.currentImageIndex.set(index);
    this.showImageModal.set(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
    document.body.style.overflow = ''; // Re-enable scrolling
  }

  prevImage(): void {
    if (this.currentImageIndex() > 0) {
      this.currentImageIndex.update((index) => index - 1);
    }
  }

  nextImage(): void {
    const property = this.property();
    if (
      property?.images &&
      this.currentImageIndex() < property.images.length - 1
    ) {
      this.currentImageIndex.update((index) => index + 1);
    }
  }

  hasAnyFeatures(property: PropertyDetail): boolean {
    return !!(
      property.has_elevator ||
      property.has_parking ||
      property.has_storage ||
      property.has_balcony
    );
  }

  /**
   * Get property ID as a number for components that require a numeric ID
   */
  getNumericPropertyId(): number {
    const id = this.property()?.id;
    if (id === undefined || id === null) {
      return 0; // or some default value
    }
    return typeof id === 'string' ? parseInt(id, 10) : id;
  }

  /**
   * Get property ID for reviews component (can handle string or number)
   */
  getPropertyIdForReviews(): string | number {
    const id = this.propertyId();
    return id || '';
  }
}
