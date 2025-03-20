// src/app/pages/(protected)/components/properties.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Session } from '@supabase/supabase-js';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-sm text-right">
      <h2 class="text-xl font-semibold mb-6">املاک ذخیره شده</h2>

      @if (properties.length === 0) {
      <p class="text-gray-500">شما هنوز هیچ ملکی را ذخیره نکرده‌اید</p>
      <div class="mt-4">
        <a
          [routerLink]="['/properties']"
          class="text-primary-600 hover:text-primary-700"
        >
          جستجو در املاک
        </a>
      </div>
      } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (property of properties; track property.id) {
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="relative pb-[66%]">
            <img
              [src]="property.imageUrl"
              [alt]="property.title"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div class="p-4">
            <h3 class="text-lg font-semibold">
              {{ property.price | number }} تومان
            </h3>
            <p class="text-gray-600 my-1">
              {{ property.bedrooms }} خواب | {{ property.bathrooms }} حمام |
              {{ property.area }} متر مربع
            </p>
            <p class="text-gray-800 mb-3">{{ property.address }}</p>
            <div class="flex justify-between">
              <a
                [routerLink]="['/properties', property.id]"
                class="text-primary-600"
              >
                مشاهده جزئیات
              </a>
              <button
                (click)="removeProperty(property.id)"
                class="text-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class PropertiesComponent {
  @Input() session: Session | null = null;

  // Sample data - would be fetched from API in a real application
  properties: any[] = [];

  ngOnInit() {
    // Here you would load the saved properties for the current user
    this.loadProperties();
  }

  loadProperties() {
    // In a real app, fetch from API/database
    // For now, using empty array to show the empty state
    this.properties = [];
  }

  removeProperty(id: string) {
    // Logic to remove a property from saved list
    this.properties = this.properties.filter((p) => p.id !== id);
  }
}
