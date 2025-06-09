// src/app/core/services/search.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { Observable, from, firstValueFrom } from 'rxjs';
import { injectTrpcClient } from '../../../trpc-client';
import { PropertyResult } from '../types/property.types';

export type SearchStage = 'property_type' | 'bedrooms' | 'price' | 'complete';

export interface SearchState {
  query: string;
  stage: SearchStage;
  propertyType?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
}

export interface SearchSuggestion {
  type: 'property_type' | 'bedrooms' | 'price_range' | 'filter';
  text: string;
  query: string;
  count?: number;
  filter?: {
    field: string;
    value?: string | number | boolean;
    min?: number;
    max?: number;
  };
}

export interface PropertySearchResult {
  results: PropertyResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  aggregations?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private _trpc = injectTrpcClient();

  // Signals for reactive state management
  private searchState = signal<SearchState>({
    query: '',
    stage: 'property_type',
    suggestions: [],
    isLoading: false,
  });

  // Computed values
  readonly query = computed(() => this.searchState().query);
  readonly stage = computed(() => this.searchState().stage);
  readonly suggestions = computed(() => this.searchState().suggestions);
  readonly isLoading = computed(() => this.searchState().isLoading);
  readonly propertyType = computed(() => this.searchState().propertyType);
  readonly bedrooms = computed(() => this.searchState().bedrooms);

  // Helper method to convert Persian numbers to Latin
  private convertPersianToLatin(text: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const latinDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = text;
    for (let i = 0; i < persianDigits.length; i++) {
      result = result.replace(
        new RegExp(persianDigits[i], 'g'),
        latinDigits[i]
      );
    }
    return result;
  }

  // Helper method to convert Latin numbers to Persian
  private convertLatinToPersian(text: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const latinDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = text;
    for (let i = 0; i < latinDigits.length; i++) {
      result = result.replace(
        new RegExp(latinDigits[i], 'g'),
        persianDigits[i]
      );
    }
    return result;
  }

  // Updated selectSuggestion method in search.service.ts
  selectSuggestion(suggestion: SearchSuggestion): void {
    const state = this.searchState();

    console.log('SearchService: selectSuggestion called with:', suggestion);
    console.log('SearchService: Current state before selection:', state);

    if (suggestion.type === 'property_type') {
      this.searchState.update((s) => ({
        ...s,
        query: suggestion.text,
        propertyType: suggestion.text,
        stage: 'bedrooms',
        suggestions: [],
      }));
      // Immediately fetch bedroom suggestions
      this.fetchBedroomSuggestions();
    } else if (suggestion.type === 'bedrooms') {
      // Extract bedroom number and preserve Persian formatting
      const bedroomMatch = suggestion.text.match(/([\u06F0-\u06F9\d]+)/);
      const bedrooms = bedroomMatch
        ? parseInt(this.convertPersianToLatin(bedroomMatch[1]))
        : 0;

      console.log(
        'SearchService: Bedroom selection - extracted bedrooms:',
        bedrooms
      );

      const currentState = this.searchState();
      const bedroomText = bedrooms
        ? `${this.convertLatinToPersian(bedrooms.toString())}خوابه`
        : '';

      const formattedQuery =
        `${currentState.propertyType} ${bedroomText}`.trim();

      this.searchState.update((s) => ({
        ...s,
        query: formattedQuery,
        bedrooms,
        stage: 'price',
        suggestions: [],
      }));

      console.log(
        'SearchService: Updated query after bedroom selection:',
        formattedQuery
      );

      // Immediately fetch price suggestions
      this.fetchPriceSuggestions();
    } else if (suggestion.type === 'price_range') {
      // Preserve the bedroom formatting when adding price
      const currentState = this.searchState();
      const bedroomText = currentState.bedrooms
        ? `${this.convertLatinToPersian(currentState.bedrooms.toString())}خوابه`
        : '';

      const formattedQuery = `${currentState.propertyType} ${bedroomText} ${suggestion.text}`;

      console.log(
        'SearchService: Price range selection - formatted query:',
        formattedQuery
      );
      console.log(
        'SearchService: Price range selection - suggestion filter:',
        suggestion.filter
      );

      this.searchState.update((s) => ({
        ...s,
        query: formattedQuery,
        stage: 'complete',
        suggestions: [],
        minPrice: suggestion.filter?.min,
        maxPrice: suggestion.filter?.max,
      }));
    }

    console.log('SearchService: State after selection:', this.searchState());
  }

  // Fetch suggestions based on current stage
  private async fetchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const state = this.searchState();
    console.log('SearchService: fetchSuggestions - current state:', state);
    console.log('SearchService: fetchSuggestions - query:', query);

    // For property type stage, show suggestions even for partial matches
    if (state.stage === 'property_type') {
      // Show property type suggestions for partial matches like "آپ"
      if (query.length >= 2) {
        console.log('SearchService: Fetching property type suggestions...');
        const response = await firstValueFrom(
          this._trpc.property.getPropertyTypeSuggestions.query({
            q: query,
            location: 'تهران', // Tehran is pre-selected
            limit: 5,
          })
        );
        console.log('SearchService: Raw response from TRPC:', response);
        // Map the response to ensure correct types
        return response.suggestions.map((s: any) => ({
          type: 'property_type' as const,
          text: s.text,
          query: s.query,
          count: s.count,
        }));
      }
      return [];
    } else if (state.stage === 'bedrooms' && state.propertyType) {
      // Get bedroom suggestions based on selected property type
      const response = await firstValueFrom(
        this._trpc.property.getBedroomSuggestions.query({
          propertyType: state.propertyType,
          limit: 5,
        })
      );
      // Map the response to ensure correct types
      return response.suggestions.map((s: any) => ({
        type: 'bedrooms' as const,
        text: s.text,
        query: s.query,
        count: s.count,
      }));
    } else if (state.stage === 'price' && state.propertyType) {
      // Get price range suggestions
      const response = await firstValueFrom(
        this._trpc.property.getPriceSuggestions.query({
          propertyType: state.propertyType,
          bedrooms: state.bedrooms,
          location: 'تهران',
        })
      );
      // Map the response to ensure correct types
      return response.suggestions.map((s: any) => ({
        type: 'price_range' as const,
        text: s.text,
        query: s.query,
        filter: s.filter
          ? {
            field: s.filter.field,
            min: s.filter.min,
            max: s.filter.max,
          }
          : undefined,
      }));
    }

    return [];
  }

  // Update the updateQuery method to handle Persian numbers
  async updateQuery(query: string): Promise<void> {
    console.log('SearchService: updateQuery called with:', query);

    // Convert Persian numbers to Latin for internal processing but keep original for display
    const normalizedQuery = this.convertPersianToLatin(query);

    this.searchState.update((state) => ({
      ...state,
      query, // Keep original query with Persian numbers
      isLoading: true,
    }));

    try {
      const suggestions = await this.fetchSuggestions(normalizedQuery);
      console.log('SearchService: suggestions received:', suggestions);
      this.searchState.update((state) => ({
        ...state,
        suggestions,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.searchState.update((state) => ({
        ...state,
        isLoading: false,
        suggestions: [],
      }));
    }
  }

  // Helper method to extract bedroom count from Persian text
  private extractBedroomsFromQuery(query: string): number | null {
    // Try Persian numbers first
    const persianMatch = query.match(/([۰-۹]+)خوابه/);
    if (persianMatch) {
      const persianNum = persianMatch[1];
      const latinNum = this.convertPersianToLatin(persianNum);
      return parseInt(latinNum);
    }

    // Try Latin numbers as fallback
    const latinMatch = query.match(/(\d+)خوابه/);
    if (latinMatch) {
      return parseInt(latinMatch[1]);
    }

    return null;
  }

  // Fetch bedroom suggestions
  private async fetchBedroomSuggestions(): Promise<void> {
    const state = this.searchState();
    if (!state.propertyType) return;

    this.searchState.update((s) => ({ ...s, isLoading: true }));

    try {
      const response = await firstValueFrom(
        this._trpc.property.getBedroomSuggestions.query({
          propertyType: state.propertyType,
          limit: 5,
        })
      );

      this.searchState.update((s) => ({
        ...s,
        suggestions: response.suggestions.map((sug: any) => ({
          type: 'bedrooms' as const,
          text: sug.text,
          query: sug.query,
          count: sug.count,
        })),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching bedroom suggestions:', error);
      this.searchState.update((s) => ({ ...s, isLoading: false }));
    }
  }

  // Fetch price suggestions
  private async fetchPriceSuggestions(): Promise<void> {
    const state = this.searchState();
    if (!state.propertyType) return;

    this.searchState.update((s) => ({ ...s, isLoading: true }));

    try {
      const response = await firstValueFrom(
        this._trpc.property.getPriceSuggestions.query({
          propertyType: state.propertyType,
          bedrooms: state.bedrooms,
          location: 'تهران',
        })
      );

      this.searchState.update((s) => ({
        ...s,
        suggestions: response.suggestions.map((sug: any) => ({
          type: 'price_range' as const,
          text: sug.text,
          query: sug.query,
          filter: sug.filter
            ? {
              field: sug.filter.field,
              min: sug.filter.min,
              max: sug.filter.max,
            }
            : undefined,
        })),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching price suggestions:', error);
      this.searchState.update((s) => ({ ...s, isLoading: false }));
    }
  }

  getSearchParams() {
    const state = this.searchState();

    // Parse the complete query for all components
    const parsedQuery = this.parseCompleteQuery(state.query);

    return {
      query: state.query,
      property_type: parsedQuery.propertyType || state.propertyType,
      bedrooms: parsedQuery.bedrooms || state.bedrooms,
      minPrice: parsedQuery.minPrice || state.minPrice,
      maxPrice: parsedQuery.maxPrice || state.maxPrice,
    };
  }

  // Add this method to parse complete Persian queries
  private parseCompleteQuery(query: string): {
    propertyType?: string;
    bedrooms?: number;
    minPrice?: number;
    maxPrice?: number;
  } {
    const result: any = {};

    // Extract property type
    const propertyTypeMatch = query.match(/(آپارتمان|ویلا|خانه|زمین)/);
    if (propertyTypeMatch) {
      result.propertyType = propertyTypeMatch[1];
    }

    // Extract bedrooms (handle Persian numbers)
    const bedroomMatch = query.match(/([۰-۹\d]+)\s*خوابه/);
    if (bedroomMatch) {
      const persianNum = bedroomMatch[1];
      result.bedrooms = parseInt(this.convertPersianToLatin(persianNum));
    }

    // Extract price range
    const pricePatterns = [
      // "بین X تا Y میلیارد"
      {
        regex: /بین\s+([۰-۹\d]+)\s+تا\s+([۰-۹\d]+)\s+میلیارد/,
        handler: (match: RegExpMatchArray) => ({
          minPrice:
            parseInt(this.convertPersianToLatin(match[1])) * 1_000_000_000,
          maxPrice:
            parseInt(this.convertPersianToLatin(match[2])) * 1_000_000_000,
        }),
      },
      // "تا X میلیارد"
      {
        regex: /تا\s+([۰-۹\d]+)\s+میلیارد/,
        handler: (match: RegExpMatchArray) => ({
          maxPrice:
            parseInt(this.convertPersianToLatin(match[1])) * 1_000_000_000,
        }),
      },
      // "حداقل X میلیارد"
      {
        regex: /حداقل\s+([۰-۹\d]+)\s+میلیارد/,
        handler: (match: RegExpMatchArray) => ({
          minPrice:
            parseInt(this.convertPersianToLatin(match[1])) * 1_000_000_000,
        }),
      },
    ];

    for (const pattern of pricePatterns) {
      const match = query.match(pattern.regex);
      if (match) {
        Object.assign(result, pattern.handler(match));
        break;
      }
    }

    return result;
  }

  reset(): void {
    this.searchState.set({
      query: '',
      stage: 'property_type',
      suggestions: [],
      isLoading: false,
    });
  }

  executeSearch(): Observable<PropertySearchResult> {
    const params = this.getSearchParams();

    // Build the search query for Elasticsearch
    const searchQuery = {
      q: '', // Empty string or omit entirely
      property_type: params.property_type, // Note: property_type not propertyType
      bedrooms: params.bedrooms, // Use the actual property names
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      page: 1,
      pageSize: 20,
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
    };

    console.log('Executing search with params:', searchQuery);

    return from(
      this._trpc.property.search.query(searchQuery)
    ) as Observable<PropertySearchResult>;
  }
}
