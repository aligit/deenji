// src/app/pages/properties.search.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectTrpcClient } from '../../trpc-client';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8 pt-20" dir="rtl">
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"
        ></div>
      </div>

      <!-- Error State -->
      <div
        *ngIf="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
      >
        <h2 class="text-xl font-semibold text-red-800 mb-2">خطا در جستجو</h2>
        <p class="text-red-700">{{ error }}</p>
      </div>

      <!-- Results -->
      <div *ngIf="!loading && !error && searchResults">
        <!-- Search Summary -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h1 class="text-2xl font-bold mb-2">نتایج جستجو</h1>
          <div class="flex flex-wrap gap-2 text-sm">
            <span
              *ngIf="searchParams.propertyType"
              class="bg-primary-100 px-3 py-1 rounded"
            >
              {{ searchParams.propertyType }}
            </span>
            <span
              *ngIf="searchParams.bedrooms"
              class="bg-primary-100 px-3 py-1 rounded"
            >
              {{ searchParams.bedrooms }} خوابه
            </span>
            <span
              *ngIf="searchParams.minPrice || searchParams.maxPrice"
              class="bg-primary-100 px-3 py-1 rounded"
            >
              قیمت: {{ formatPriceRange() }}
            </span>
          </div>
          <p class="text-gray-600 mt-2">
            {{ searchResults.total }} ملک پیدا شد
          </p>
        </div>

        <!-- Results Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let property of searchResults.results"
            class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">{{ property.title }}</h3>
              <p class="text-2xl font-bold text-primary-600 mb-2">
                {{ formatPrice(property.price) }} تومان
              </p>
              <div class="flex gap-4 text-sm text-gray-600">
                <span *ngIf="property.bedrooms"
                  >{{ property.bedrooms }} خواب</span
                >
                <span *ngIf="property.area">{{ property.area }} متر</span>
              </div>
              <p class="text-gray-700 mt-2" *ngIf="property.description">
                {{ property.description | slice : 0 : 100 }}...
              </p>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div
          *ngIf="searchResults.results.length === 0"
          class="text-center py-12"
        >
          <p class="text-gray-500 text-lg">هیچ ملکی با این مشخصات یافت نشد</p>
        </div>
      </div>
    </div>
  `,
})
export default class PropertiesSearchPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _trpc = injectTrpcClient();

  loading = true;
  error: string | null = null;
  searchResults: any = null;
  searchParams: any = {};

  ngOnInit() {
    // Get search parameters from URL
    this.route.queryParams.subscribe((params) => {
      this.searchParams = {
        propertyType: params['propertyType'],
        bedrooms: params['bedrooms'] ? parseInt(params['bedrooms']) : undefined,
        minPrice: params['minPrice'] ? parseInt(params['minPrice']) : undefined,
        maxPrice: params['maxPrice'] ? parseInt(params['maxPrice']) : undefined,
      };

      // Execute search immediately
      this.executeSearch();
    });
  }

  executeSearch() {
    this.loading = true;
    this.error = null;

    const searchQuery = {
      property_type: this.searchParams.propertyType,
      minBedrooms: this.searchParams.bedrooms,
      maxBedrooms: this.searchParams.bedrooms,
      minPrice: this.searchParams.minPrice,
      maxPrice: this.searchParams.maxPrice,
      page: 1,
      pageSize: 20,
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
    };

    console.log('🔍 Executing search with query:', searchQuery);

    this._trpc.property.search.query(searchQuery).subscribe({
      next: (data) => {
        this.searchResults = data;
        console.log('📊 Search results:', data);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.error = 'خطا در جستجوی املاک. لطفاً دوباره تلاش کنید.';
      },
      complete: () => {
        this.loading = false;
      },
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
