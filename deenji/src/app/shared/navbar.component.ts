import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularSvgIconModule } from "angular-svg-icon";

@Component({
  selector: "app-navbar",
  imports: [CommonModule, AngularSvgIconModule],
  template: `
    <header
      class="fixed top-6 left-0 right-0 bg-secondary-900 bg-opacity-90 z-50"
    >
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative flex items-center h-16">
          <!-- Right: Buy/Sell links -->
          <div class="flex flex-1 items-center">
            <div class="hidden md:flex items-center space-x-6">
              <a
                href="/buy"
                class="text-primary-100 hover:text-primary-300 text-sm font-medium rtl:ml-6 ltr:mr-6"
              >
                خرید
              </a>
              <a
                href="/sell"
                class="text-primary-100 hover:text-primary-300 text-sm font-medium"
              >
                فروش
              </a>
            </div>
          </div>

          <!-- Centralized Logo -->
          <div
            class="absolute inset-x-0 flex justify-center items-center pointer-events-none"
          >
            <a href="/" class="text-2xl font-semibold pointer-events-auto">
              <svg-icon
                src="/images/deenji.svg"
                [svgStyle]="{ 'width.px': 90, fill: 'white' }"
              ></svg-icon>
            </a>
          </div>

          <!-- Right group: Help and Sign In -->
          <div class="flex flex-1 justify-end items-center">
            <div class="hidden md:flex items-center space-x-6">
              <a
                href="/help"
                class="text-primary-100 hover:text-primary-300 text-sm"
              >
                پشتیبانی
              </a>
              <button
                class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                ورود / ثبت نام
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
})
export class NavbarComponent {}
