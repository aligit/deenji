import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-hero",
  imports: [CommonModule],
  template: `
    <section class="relative min-h-[600px] pt-24">
      <!-- Background Image -->
      <div class="absolute inset-0 z-0">
        <div
          class="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"
        ></div>
        <img
          src="https://napa.wpresidence.net/wp-content/uploads/2024/05/67629-webp-e1716972745651.webp"
          alt="Luxury Real Estate"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Hero Content -->
      <div
        class="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 py-10"
      >
        <h1 class="text-5xl md:text-6xl font-bold text-center mb-6 max-w-4xl">
          حساب شده<span class="block">بخر</span>
        </h1>

        <!-- Search Bar -->
        <div class="w-full max-w-2xl" id="banner-search">
          <div class="relative">
            <input
              type="text"
              placeholder="آدرس، محله، شهر یا کد پستی را وارد کنید"
              class="w-full h-14 px-4 pr-12 rounded-lg border border-gray-200 bg-white text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            <button class="absolute right-4 top-1/2 -translate-y-1/2">
              <svg
                class="w-6 h-6 text-gray-400"
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
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {}
