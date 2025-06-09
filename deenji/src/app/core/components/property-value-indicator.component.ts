import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-property-value-indicator',
  imports: [CommonModule],
  template: `
    <dl class="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg text-right">
      <!-- Estimated Value -->
      <div>
        <dt class="text-sm font-medium text-gray-600 mb-1">ارزش تخمینی</dt>
        <dd>
          <span
            [ngClass]="{
              'bg-green-100 text-green-800': getStatus() === 'above',
              'bg-yellow-100 text-yellow-800': getStatus() === 'normal',
              'bg-red-100 text-red-800': getStatus() === 'below'
            }"
            class="inline-block rounded-full px-3 py-1 text-xl font-bold"
          >
            {{ formatPrice(estimatedValue) }}
          </span>
          <div
            class="mt-1 flex items-center text-xs text-gray-500 space-x-2 rtl:space-x-reverse"
          >
            <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            <span>بالاتر از متوسط بازار</span>
            <span
              class="inline-block w-2 h-2 rounded-full bg-yellow-500"
            ></span>
            <span>در محدوده متوسط</span>
            <span class="inline-block w-2 h-2 rounded-full bg-red-500"></span>
            <span>پایین‌تر از متوسط</span>
          </div>
        </dd>
      </div>

      <!-- Price Range -->
      <div>
        <dt class="text-sm font-medium text-gray-600 mb-1">بازه قیمت</dt>
        <dd class="text-lg font-semibold text-gray-800">
          {{ formatPrice(minPrice) }} – {{ formatPrice(maxPrice) }}
        </dd>
      </div>

      <!-- Rent Estimate -->
    </dl>
  `,
})
export class PropertyValueIndicatorComponent {
  @Input() estimatedValue?: number;
  @Input() minPrice?: number;
  @Input() maxPrice?: number;
  @Input() rentEstimate?: number;

  // Shared utility to format numbers into localized currency strings
  formatPrice(price: number | undefined): string {
    if (price == null) return '—'; // return an em dash if no value
    const abs = Math.abs(price);
    // Format in میلیارد (billion), میلیون (million), or هزار (thousand)
    if (abs >= 1_000_000_000) {
      const val = (price / 1_000_000_000).toFixed(1);
      return `${this.toPersianDigits(val)} میلیارد تومان`;
    }
    if (abs >= 1_000_000) {
      const val = (price / 1_000_000).toFixed(1);
      return `${this.toPersianDigits(val)} میلیون تومان`;
    }
    if (abs >= 1_000) {
      const val = (price / 1_000).toFixed(0);
      return `${this.toPersianDigits(val)} هزار تومان`;
    }
    // For smaller values, just use localized formatting with currency
    return `${this.toPersianDigits(price.toLocaleString('en-US'))} تومان`;
  }

  // Optional: helper to convert English digits to Persian digits for display
  private toPersianDigits(str: string): string {
    const persianMap: Record<string, string> = {
      '0': '۰',
      '1': '۱',
      '2': '۲',
      '3': '۳',
      '4': '۴',
      '5': '۵',
      '6': '۶',
      '7': '۷',
      '8': '۸',
      '9': '۹',
      ',': '٬',
    };
    return String(str).replace(/[0-9,]/g, (char) => persianMap[char] || char);
  }

  getStatus(): 'above' | 'normal' | 'below' {
    if (!this.estimatedValue || !this.minPrice || !this.maxPrice) {
      return 'normal';
    }
    const mid = (this.minPrice + this.maxPrice) / 2;
    if (this.estimatedValue > mid * 1.1) return 'above'; // >10% above market
    if (this.estimatedValue < mid * 0.9) return 'below'; // >10% below market
    return 'normal'; // within ±10%
  }
}
