// src/app/pages/home/hero.component.ts
import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/helm/input';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import {
  SearchService,
  SearchSuggestion,
} from '../../core/services/search.service';
import { SearchSuggestionsComponent } from '../home/search-suggestion.component';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmInputDirective,
    HlmButtonDirective,
    SearchSuggestionsComponent,
  ],
  template: `
    <section
      class="relative w-full min-h-[600px] bg-no-repeat bg-cover bg-center"
      style="background-image: url('https://napa.wpresidence.net/wp-content/uploads/2024/05/67629-webp-e1716972745651.webp');"
      dir="rtl"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-l from-black/50 to-black/30"
      ></div>

      <!-- Content container -->
      <div
        class="relative z-10 flex flex-col justify-center items-start h-full w-full
                  px-4 py-10 text-white md:px-8 md:pt-32 md:pb-16"
      >
        <!-- Text + Search wrapper -->
        <div class="w-full md:w-1/2">
          <!-- Heading -->
          <h1 class="text-4xl md:text-6xl font-bold mb-4 md:mb-6">
            حساب شده
            <span class="block">بخر</span>
          </h1>

          <!-- Search Form -->
          <form
            class="w-full md:w-192 lg:w-192"
            (submit)="handleSubmit($event)"
            (keydown)="handleKeyDown($event)"
          >
            <div class="relative">
              <!-- Search Input -->
              <input
                hlmInput
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchQueryChange($event)"
                (focus)="onInputFocus()"
                (blur)="onInputBlur()"
                [placeholder]="getPlaceholder()"
                class="w-full h-12 md:h-14 px-4 pr-12 text-base text-gray-800
                       focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10
                       bg-white rounded-lg"
                autocomplete="off"
                dir="rtl"
              />

              <!-- Search button -->
              <button
                hlmBtn
                type="submit"
                class="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md"
                [disabled]="!canSearch()"
                aria-label="جستجو"
                (click)="handleSearchButtonClick($event)"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              <!-- Loading indicator -->
              <div
                *ngIf="searchService.isLoading()"
                class="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <div
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"
                ></div>
              </div>

              <!-- Debug Info (remove in production) -->
              <div *ngIf="true" class="text-white text-xs mt-1">
                Debug: {{ searchService.suggestions().length }} suggestions,
                Loading: {{ searchService.isLoading() }}, Show:
                {{ showSuggestions() }}, Stage: {{ searchService.stage() }}, Can
                Search: {{ canSearch() }}
              </div>

              <!-- Suggestions dropdown -->
              <app-search-suggestions
                [suggestions]="searchService.suggestions()"
                [isLoading]="searchService.isLoading()"
                (selectSuggestion)="onSelectSuggestion($event)"
                *ngIf="showSuggestions()"
              />
            </div>

            <!-- Search stage pills -->
            <div
              class="mt-3 flex items-center gap-2 flex-wrap"
              *ngIf="searchService.stage() !== 'property_type'"
            >
              @if (searchService.propertyType()) {
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 text-white"
              >
                {{ searchService.propertyType() }}
              </span>
              } @if (searchService.bedrooms()) {
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 text-white"
              >
                {{ formatBedroomsDisplay(searchService.bedrooms()!) }} خوابه
              </span>
              } @if (searchService.stage() === 'complete') {
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/20 text-white border border-green-300"
              >
                آماده جستجو
              </span>
              }
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent implements OnDestroy {
  searchService = inject(SearchService);
  private router = inject(Router);
  private searchInput$ = new Subject<string>();

  searchQuery = '';
  showSuggestions = signal(false);

  constructor() {
    // Debounce search input
    this.searchInput$
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((query) => {
        console.log('HeroComponent: Debounced query:', query);
        if (
          query.length >= 2 ||
          this.searchService.stage() !== 'property_type'
        ) {
          this.searchService.updateQuery(query);
        }
      });

    // Show suggestions when we have them
    effect(() => {
      const suggestions = this.searchService.suggestions();
      const isLoading = this.searchService.isLoading();
      const stage = this.searchService.stage();

      console.log(
        'HeroComponent: Effect triggered - suggestions:',
        suggestions,
        'isLoading:',
        isLoading,
        'stage:',
        stage
      );

      const hasSuggestions = suggestions.length > 0;
      this.showSuggestions.set(hasSuggestions || isLoading);
    });

    // Debug effect for price range selection
    effect(() => {
      const stage = this.searchService.stage();
      const searchParams = this.searchService.getSearchParams();

      if (
        stage === 'complete' &&
        searchParams.minPrice &&
        searchParams.maxPrice
      ) {
        console.log('🔍 PRICE RANGE SELECTED - Debug Info:');
        console.log('Current query:', this.searchQuery);
        console.log('Search params:', searchParams);
        console.log('Property type:', searchParams.property_type);
        console.log('Bedrooms:', searchParams.bedrooms);
        console.log(
          'Price range:',
          searchParams.minPrice,
          'to',
          searchParams.maxPrice
        );
        console.log('Search service state:', {
          stage: this.searchService.stage(),
          query: this.searchService.query(),
          propertyType: this.searchService.propertyType(),
          bedrooms: this.searchService.bedrooms(),
        });
      }
    });
  }

  onSearchQueryChange(query: string) {
    console.log('HeroComponent: onSearchQueryChange:', query);
    this.searchInput$.next(query);

    // Parse the query to extract property type, bedrooms, and price range
    const propertyTypeMatch = query.match(/آپارتمان|ویلا|خانه|زمین/);
    const bedroomsMatch = query.match(/(\d+)خوابه/);
    const priceRangeMatch = query.match(/بین\s+(\d+)\s+تا\s+(\d+)\s+میلیارد/);

    if (propertyTypeMatch) {
      const propertyType = propertyTypeMatch[0];
      this.searchService.selectSuggestion({
        type: 'property_type',
        text: propertyType,
        query: propertyType,
      });
    }

    if (bedroomsMatch) {
      const bedrooms = parseInt(bedroomsMatch[1], 10);
      this.searchService.selectSuggestion({
        type: 'bedrooms',
        text: `${bedrooms}خوابه`,
        query: `${bedrooms}خوابه`,
      });
    }

    if (priceRangeMatch) {
      const minPrice = parseInt(priceRangeMatch[1], 10) * 1000000;
      const maxPrice = parseInt(priceRangeMatch[2], 10) * 1000000;
      this.searchService.selectSuggestion({
        type: 'price_range',
        text: `بین ${minPrice} تا ${maxPrice} میلیارد`,
        query: `بین ${minPrice} تا ${maxPrice} میلیارد`,
        filter: { field: 'price', min: minPrice, max: maxPrice },
      });
    }
  }

  onInputFocus() {
    if (this.searchService.suggestions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onInputBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  onSelectSuggestion(suggestion: SearchSuggestion) {
    console.log('HeroComponent: Suggestion selected:', suggestion);

    this.searchService.selectSuggestion(suggestion);

    // Update search query with proper Persian number formatting
    const newQuery = this.searchService.query();
    this.searchQuery = newQuery;

    console.log('HeroComponent: Updated search query:', this.searchQuery);
    console.log(
      'HeroComponent: Current stage after selection:',
      this.searchService.stage()
    );

    this.showSuggestions.set(false);

    // Auto-navigate if search is complete
    if (this.searchService.stage() === 'complete') {
      setTimeout(() => {
        this.navigateToSearch();
      }, 500); // Small delay to show the complete state
    }
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    console.log('HeroComponent: Form submitted');
    this.executeSearch();
  }

  // Fixed: Changed parameter type from KeyboardEvent to Event
  handleKeyDown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      console.log('HeroComponent: Enter key pressed');
      this.executeSearch();
    }
  }

  handleSearchButtonClick(event: Event) {
    event.preventDefault();
    console.log('HeroComponent: Search button clicked');
    this.executeSearch();
  }

  private executeSearch() {
    console.log('HeroComponent: Executing search...');
    console.log('HeroComponent: Current stage:', this.searchService.stage());
    console.log('HeroComponent: Can search:', this.canSearch());

    if (this.canSearch()) {
      this.navigateToSearch();
    } else {
      console.log(
        'HeroComponent: Search not ready yet, current stage:',
        this.searchService.stage()
      );
      // Optionally show a message to the user
    }
  }

  private navigateToSearch() {
    const searchParams = this.searchService.getSearchParams();

    console.log('🔍 Navigating to search with params:', searchParams);

    // Build URL parameters - only send structured data, not the query string
    const params: { [key: string]: string } = {};

    // Only add parameters that have values
    if (searchParams.property_type)
      params['propertyType'] = searchParams.property_type;
    if (searchParams.bedrooms)
      params['bedrooms'] = searchParams.bedrooms.toString();
    if (searchParams.minPrice)
      params['minPrice'] = searchParams.minPrice.toString();
    if (searchParams.maxPrice)
      params['maxPrice'] = searchParams.maxPrice.toString();

    // Don't send the full query string - we've already extracted what we need
    // params['q'] = searchParams.query; // REMOVE THIS

    // Navigate with clean, structured parameters
    this.router.navigate(['/properties/search'], { queryParams: params });
  }

  private convertToPersianNumbers(num: string | number): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num
      .toString()
      .replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  }

  formatBedroomsDisplay(bedrooms: number): string {
    return this.convertToPersianNumbers(bedrooms);
  }

  canSearch(): boolean {
    const stage = this.searchService.stage();
    const hasQuery = this.searchQuery.trim().length > 0;

    // Can search if:
    // 1. Stage is complete, OR
    // 2. Has some query text (for basic search)
    return stage === 'complete' || (hasQuery && stage !== 'property_type');
  }

  getPlaceholder(): string {
    const stage = this.searchService.stage();

    switch (stage) {
      case 'property_type':
        return 'نوع ملک را وارد کنید (مثلا: آپارتمان، ویلا)';
      case 'bedrooms':
        return 'تعداد خواب را انتخاب کنید';
      case 'price':
        return 'محدوده قیمت را انتخاب کنید';
      case 'complete':
        return 'برای جستجو کلیک کنید';
      default:
        return 'جستجوی ملک در تهران';
    }
  }

  ngOnDestroy() {
    this.searchService.reset();
  }
}
