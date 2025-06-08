// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
//
// @Component({
//   selector: 'property-value-indicator',
//   imports: [CommonModule],
//   template: `<p>property-value-indicator works!</p>`,
//   styles: ``,
// })
// export class PropertyValueIndicatorComponent {}
//
//
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';

interface EstimatedValueData {
  estimatedValue: number;
  priceRangeMin: number;
  priceRangeMax: number;
  rentEstimate: number;
}

@Component({
  selector: 'app-property-value-indicator',
  standalone: true,
  imports: [CommonModule, HlmBadgeDirective],
  template: `
    <div
      class="bg-gray-100 p-4 rounded-lg transition-all duration-300"
      *ngIf="data"
    >
      <div class="text-right">
        <div class="text-3xl font-bold text-green-700 mb-1">
          <span hlmBadge>{{ data.estimatedValue | currency }}</span>
        </div>
        <div class="text-sm text-gray-600">ارزش تخمینی</div>
      </div>
      <div
        class="text-right mt-2"
        *ngIf="data.priceRangeMin && data.priceRangeMax"
      >
        <div class="text-lg text-gray-600">
          {{ data.priceRangeMin | currency : 'IRR' }} -
          {{ data.priceRangeMax | currency : 'IRR' }}
        </div>
        <div class="text-sm text-gray-500">بازه قیمت</div>
      </div>
      <div class="text-right mt-2" *ngIf="data.rentEstimate">
        <div class="text-lg text-gray-600">
          {{ data.rentEstimate | currency : 'IRR' }}
        </div>
        <div class="text-sm text-gray-500">اجاره تخمینی</div>
      </div>
    </div>
  `,
})
export class PropertyValueIndicatorComponent {
  @Input() data: EstimatedValueData | null = null;
}
