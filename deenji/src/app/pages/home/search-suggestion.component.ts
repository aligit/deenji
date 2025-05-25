// src/app/components/search-suggestions.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchSuggestion } from '../../core/services/search.service';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideHouse,
  lucideSearch,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-search-suggestions',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmIconDirective],
  providers: [provideIcons({ lucideChevronRight, lucideHouse, lucideSearch })],
  template: `
    <div
      class="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
      [class.hidden]="!showSuggestions()"
    >
      <ul class="py-1 max-h-80 overflow-y-auto">
        @for (suggestion of suggestions(); track suggestion.text) {
        <li
          (click)="onSelectSuggestion(suggestion)"
          class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div class="flex items-center justify-between" dir="rtl">
            <div class="flex items-center gap-3">
              <ng-icon
                hlm
                [name]="getIconForSuggestion(suggestion)"
                size="lg"
                class="text-gray-400"
              />
              <span class="text-gray-900 font-medium">{{
                suggestion.text
              }}</span>
            </div>
            @if (suggestion.count) {
            <span class="text-sm text-gray-500">({{ suggestion.count }})</span>
            }
          </div>
        </li>
        }
      </ul>

      @if (isLoading()) {
      <div class="px-4 py-3 text-center text-gray-500 border-t border-gray-100">
        <div
          class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"
        ></div>
      </div>
      }
    </div>
  `,
})
export class SearchSuggestionsComponent {
  suggestions = input.required<SearchSuggestion[]>();
  isLoading = input<boolean>(false);
  selectSuggestion = output<SearchSuggestion>();

  showSuggestions = computed(
    () => this.suggestions().length > 0 || this.isLoading()
  );

  onSelectSuggestion(suggestion: SearchSuggestion) {
    this.selectSuggestion.emit(suggestion);
  }

  getIconForSuggestion(suggestion: SearchSuggestion): string {
    switch (suggestion.type) {
      case 'property_type':
        return 'lucideHouse';
      case 'bedrooms':
        return 'lucideChevronRight';
      case 'price_range':
      case 'filter':
        return 'lucideSearch';
      default:
        return 'lucideSearch';
    }
  }
}
