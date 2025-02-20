import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-hero",
  imports: [CommonModule],
  template: `
    <section
      class="relative w-full min-h-[600px] bg-no-repeat bg-cover bg-center"
      style="background-image: url('https://napa.wpresidence.net/wp-content/uploads/2024/05/67629-webp-e1716972745651.webp');"
      dir="rtl"
    >
      <!-- Overlay for contrast -->
      <div
        class="absolute inset-0 bg-gradient-to-l from-black/50 to-black/30"
      ></div>

      <!--
        Container for text and search,
        pinned to the right in RTL by default
      -->
      <div
        class="relative z-10 flex flex-col justify-center items-start h-full w-full px-8 pt-32 pb-10 text-white"
      >
        <div class="w-1/2">
          <!-- Heading -->
          <h1 class="text-5xl md:text-6xl font-bold mb-6">
            حساب شده
            <span class="block">بخر</span>
          </h1>

          <!-- Search Form (about two-thirds of the half) -->
          <form class="w-2/3">
            <div class="relative">
              <input
                type="text"
                name="searchQuery"
                placeholder="آدرس، محله، شهر یا کد پستی را وارد کنید"
                class="w-full h-14 px-4 pr-20 rounded-lg border border-gray-200
                       bg-white text-base text-gray-800
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />

              <!-- Search button -->
              <button
                type="submit"
                class="absolute right-4 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
                aria-label="Submit Search"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0
                       11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {}
