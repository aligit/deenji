import {
  Component,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { Injector } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Simplified interfaces focused on what we actually use
interface PropertySource {
  title: string;
  price?: number;
  area?: number;
  bedrooms?: number;
}

interface ElasticsearchHit {
  _source: PropertySource;
}

interface SearchSuggestion {
  type: 'property' | 'filter';
  text: string;
  query: string;
  filter?: {
    field: string;
    value: any;
  };
}

@Component({
  selector: 'app-sticky-search',
  standalone: true,
  imports: [
    CommonModule,
    AngularSvgIconModule,
    RouterModule,
    ReactiveFormsModule,
  ],
  template: `
    <div
      class="fixed top-0 left-0 right-0 bg-white shadow-md z-50 min-h-16 py-4 transition-all duration-300"
      [ngClass]="{
        'opacity-0 invisible -translate-y-full': !showStickyHeader(),
        'opacity-100 visible translate-y-0': showStickyHeader()
      }"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center"
      >
        <div class="flex items-center w-full max-w-3xl mx-auto relative">
          <a [routerLink]="['/']" class="mr-4">
            <svg-icon
              src="/images/deenji.svg"
              [svgStyle]="{ 'width.px': 90, fill: 'black' }"
            ></svg-icon>
          </a>
          <div class="flex-1 relative">
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="آدرس، محله، شهر یا کد پستی را وارد کنید"
              class="w-full h-11 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              (focus)="onInputFocus()"
              (blur)="onInputBlur()"
            />
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2"
              (click)="submitSearch()"
            >
              <svg
                class="w-5 h-5 text-gray-400"
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

            <!-- Clear input button -->
            <button
              *ngIf="searchControl.value && searchControl.value.length > 0"
              class="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              (click)="clearSearch()"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Search suggestions dropdown -->
          <div
            *ngIf="showSuggestions() && suggestions().length > 0"
            class="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md max-h-96 overflow-y-auto z-10"
            [style.right]="'90px'"
          >
            <div
              *ngFor="let suggestion of suggestions()"
              class="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              (click)="selectSuggestion(suggestion)"
            >
              <!-- Icon -->
              <div class="mr-3 text-gray-500">
                <svg
                  *ngIf="suggestion.type === 'property'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <svg
                  *ngIf="suggestion.type === 'filter'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>

              <!-- Suggestion text -->
              <div>
                <p class="text-gray-900">{{ suggestion.text }}</p>
              </div>
            </div>

            <!-- Loading indicator -->
            <div
              *ngIf="searchResource.isLoading()"
              class="px-4 py-3 text-center text-gray-500"
            >
              <svg
                class="animate-spin h-5 w-5 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  host: {
    class: 'block h-0',
  },
})
export class StickySearchComponent implements OnInit {
  public showStickyHeader = signal<boolean>(false);
  public searchControl = new FormControl('');
  public searchTerm = signal<string>('');
  public showSuggestions = signal<boolean>(false);

  private scrollThreshold = 200;
  private scrollTimer: any = null;
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  // Create debounced search term signal
  private debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  // Use httpResource with our debouncedSearchTerm
  public searchResource = httpResource<{ hits: ElasticsearchHit[] }>(
    () => {
      const term = this.debouncedSearchTerm();
      return term.length >= 2
        ? `/api/search?q=${encodeURIComponent(term)}`
        : undefined;
    },
    {
      injector: this.injector,
      defaultValue: { hits: [] },
    }
  );

  // Create a computed signal for suggestions
  public suggestions = computed<SearchSuggestion[]>(() => {
    if (this.searchResource.error() || !this.searchResource.value()) {
      return [];
    }

    const hits = this.searchResource.value().hits || [];
    if (hits.length === 0) {
      return [];
    }

    // Convert Elasticsearch hits to suggestions
    const suggestions: SearchSuggestion[] = [];

    // Add property title suggestions
    hits.slice(0, 3).forEach((hit) => {
      if (hit._source.title) {
        suggestions.push({
          type: 'property',
          text: hit._source.title,
          query: hit._source.title,
        });
      }
    });

    // Add bedroom filter suggestions
    if (hits.some((hit) => hit._source.bedrooms)) {
      [2, 3, 4].forEach((count) => {
        if (
          hits.some(
            (hit) => hit._source.bedrooms && hit._source.bedrooms >= count
          )
        ) {
          suggestions.push({
            type: 'filter',
            text: `${this.searchTerm()} با حداقل ${count} خوابه`,
            query: `${this.searchTerm()} با حداقل ${count} خوابه`,
            filter: {
              field: 'bedrooms',
              value: count,
            },
          });
        }
      });
    }

    // Add price filter suggestion
    const priceValues = hits
      .filter((hit) => hit._source.price)
      .map((hit) => hit._source.price as number);

    if (priceValues.length > 0) {
      const maxPrice = Math.max(...priceValues);
      const roundedMax = Math.ceil(maxPrice / 100000000) * 100000000;

      suggestions.push({
        type: 'filter',
        text: `${this.searchTerm()} با قیمت زیر ${roundedMax / 1000000}M`,
        query: `${this.searchTerm()} با قیمت زیر ${roundedMax / 1000000}M`,
        filter: {
          field: 'price',
          value: roundedMax,
        },
      });
    }

    // Add area filter suggestion
    const areaValues = hits
      .filter((hit) => hit._source.area)
      .map((hit) => hit._source.area as number);

    if (areaValues.length > 0) {
      const minArea = Math.min(...areaValues);

      suggestions.push({
        type: 'filter',
        text: `${this.searchTerm()} با حداقل متراژ ${minArea}`,
        query: `${this.searchTerm()} با حداقل متراژ ${minArea}`,
        filter: {
          field: 'area',
          value: minArea,
        },
      });
    }

    return suggestions;
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollPosition();
      this.searchControl.valueChanges.subscribe((value) => {
        this.searchTerm.set(value || '');
        this.showSuggestions.set(!!(value && value.length >= 2));
      });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.scrollTimer) {
      this.scrollTimer = requestAnimationFrame(() => {
        this.checkScrollPosition();
        this.scrollTimer = null;
      });
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('app-sticky-search')) {
      this.showSuggestions.set(false);
    }
  }

  private checkScrollPosition(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.showStickyHeader.set(window.scrollY > this.scrollThreshold);
  }

  public onInputFocus(): void {
    const value = this.searchControl.value;
    if (value && value.length > 1) {
      this.showSuggestions.set(true);
    }
  }

  public onInputBlur(): void {
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  public clearSearch(): void {
    this.searchControl.setValue('');
    this.showSuggestions.set(false);
  }

  public selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchControl.setValue(suggestion.query);
    this.showSuggestions.set(false);
    this.submitSearch(suggestion.filter);
  }

  public submitSearch(filter?: { field: string; value: any }): void {
    if (!this.searchControl.value) return;

    // Build search query parameters
    const params: Record<string, any> = {
      q: this.searchControl.value,
    };

    // Add explicit filter
    if (filter) {
      params[filter.field] = filter.value;
    }

    // Parse implicit filters from query
    const query = this.searchControl.value;

    // Bedrooms filter
    const bedroomMatch = query.match(/با\s+حداقل\s+(\d+)\s+خوابه/i);
    if (bedroomMatch) {
      params['minBedrooms'] = parseInt(bedroomMatch[1], 10);
    }

    // Price filter
    const priceMatch = query.match(/با\s+قیمت\s+زیر\s+(\d+)([MBmb])/i);
    if (priceMatch) {
      const value = parseInt(priceMatch[1], 10);
      const unit = priceMatch[2].toUpperCase();
      params['maxPrice'] = unit === 'M' ? value * 1000000 : value * 1000000000;
    }

    // Area filter
    const areaMatch = query.match(/با\s+حداقل\s+متراژ\s+(\d+)/i);
    if (areaMatch) {
      params['minArea'] = parseInt(areaMatch[1], 10);
    }

    console.log('Searching with params:', params);
    // this.router.navigate(['/search'], { queryParams: params });
  }
}
