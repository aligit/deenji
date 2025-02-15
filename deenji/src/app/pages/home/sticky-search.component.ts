import { Component, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularSvgIconModule } from "angular-svg-icon";

@Component({
  selector: "app-sticky-search",
  imports: [CommonModule, AngularSvgIconModule],
  template: `
    <div
      class="fixed top-0 left-0 right-0 bg-white shadow-md z-50 transition-all duration-300 min-h-16 py-4"
      [class.opacity-0]="!showStickyHeader"
      [class.invisible]="!showStickyHeader"
      [class.opacity-100]="showStickyHeader"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center"
      >
        <div class="flex items-center w-full max-w-3xl mx-auto">
          <a href="/" class="mr-4">
            <svg-icon
              src="/images/deenji.svg"
              [svgStyle]="{ 'width.px': 90, fill: 'black' }"
            ></svg-icon>
          </a>
          <div class="flex-1 relative">
            <input
              type="text"
              placeholder="آدرس، محله، شهر یا کد پستی را وارد کنید"
              class="w-full h-11 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button class="absolute right-3 top-1/2 -translate-y-1/2">
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
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StickySearchComponent {
  public showStickyHeader = false;

  @HostListener("window:scroll", [])
  onWindowScroll() {
    const bannerSearch = document.getElementById("banner-search");

    if (bannerSearch) {
      const bannerPosition = bannerSearch.getBoundingClientRect().top;
      this.showStickyHeader = bannerPosition < 0;
    }
  }
}
