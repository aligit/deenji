import { Component, HostListener } from '@angular/core';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { shareReplay, Subject, switchMap } from 'rxjs';
import { waitFor } from '@analogjs/trpc';
import { injectTrpcClient } from '../../trpc-client';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'toto',
  imports: [AsyncPipe, FormsModule, NgFor, DatePipe, NgIf, AngularSvgIconModule],
  host: {
    class: 'flex min-h-screen flex-col text-zinc-900',
  },
  styles: [`
    /* Header Styles */
    .hero-section {
      position: relative;
      min-height: 300px;
    }

    .main-header {
      position: relative;
      z-index: 20;
      background: transparent;
    }

    .main-header nav {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    /* Sticky Search Header */
    .sticky-search-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      background-color: #fff;
      min-height: 4rem;
      padding: 1rem 0;
    }

    .sticky-search-header.opacity-0 {
      transition: opacity 0.3s ease, visibility 0s linear 0.3s;
    }

    .sticky-search-header.opacity-100 {
      transition: opacity 0.3s ease;
    }

    /* Hero Section */
    .hero-content {
      position: relative;
      z-index: 10;
      padding-top: 120px;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
    }

    /* Search Inputs */
    .search-input {
      width: 100%;
      height: 56px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background-color: white;
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  `],
  template: `
  <header class="fixed top-6 left-0 right-0 bg-secondary-900 bg-opacity-90 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <a href="/" class="text-2xl font-semibold">
              <svg-icon src="/images/deenji.svg" [svgStyle]="{ 'width.px':90, 'fill':'white' }"></svg-icon>
            </a>
            <div class="hidden md:flex items-center space-x-6">
              <a href="/buy" class="text-primary-100 hover:text-primary-300 text-sm font-medium">Buy</a>
              <a href="/rent" class="text-primary-100 hover:text-primary-300 text-sm font-medium">Rent</a>
              <a href="/sell" class="text-primary-100 hover:text-primary-300 text-sm font-medium">Sell</a>
              <a href="/home-loans" class="text-primary-100 hover:text-primary-300 text-sm font-medium">Home Loans</a>
              <a href="/agent-finder" class="text-primary-100 hover:text-primary-300 text-sm font-medium">Find an Agent</a>
            </div>
          </div>
          <div class="hidden md:flex items-center space-x-6">
            <a href="/manage-rentals" class="text-primary-100 hover:text-primary-300 text-sm">Manage Rentals</a>
            <a href="/advertise" class="text-primary-100 hover:text-primary-300 text-sm">Advertise</a>
            <a href="/help" class="text-primary-100 hover:text-primary-300 text-sm">Help</a>
            <button class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">Sign In</button>
          </div>
        </div>
      </nav>
    </header>


    <!-- Sticky Search Header (appears after scroll) -->
    <div class="sticky-search-header fixed top-0 left-0 right-0 bg-white shadow-md z-50 transition-all duration-300"
         [class.opacity-0]="!showStickyHeader"
         [class.invisible]="!showStickyHeader"
         [class.opacity-100]="showStickyHeader">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <div class="flex items-center w-full max-w-3xl mx-auto">
          <a href="/" class="mr-4">
            <svg-icon src="/images/deenji.svg" [svgStyle]="{ 'width.px':90, 'fill':'black' }"></svg-icon>
          </a>
          <div class="flex-1 relative">
            <input
              type="text"
              placeholder="Enter an address, neighborhood, city, or ZIP code"
              class="w-full h-11 pl-4 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>


    <main class="flex-1">
      <!-- Hero Section -->
      <section class="hero-section relative min-h-[600px] pt-24">
        <!-- Background Image -->
        <div class="absolute inset-0 z-0">
          <div class="hero-overlay absolute inset-0 bg-black bg-opacity-40"></div>
          <img
            src="https://napa.wpresidence.net/wp-content/uploads/2024/05/67629-webp-e1716972745651.webp"
            alt="Luxury Real Estate"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 py-10">
          <h1 class="text-5xl md:text-6xl font-bold text-center mb-6 max-w-4xl">
            Find it. Tour it.
            <span class="block">Own it.</span>
          </h1>

          <!-- Search Bar -->
          <div class="w-full max-w-2xl banner-search">
            <div class="relative">
              <input
                type="text"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
                class="w-full h-14 pl-4 pr-12 text-secondary-800 bg-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button class="absolute right-4 top-1/2 -translate-y-1/2">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Properties Section -->
      <section class="max-w-7xl mx-auto px-4 py-16">
        <h2 class="text-3xl font-semibold mb-8">Featured Properties</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Property Card -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative pb-[66%]">
              <img
                src="https://napa-residence.b-cdn.net/wp-content/uploads/2014/05/ranch10-1000x623-1-500x540.webp"
                alt="Property"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="text-xl font-semibold mb-2">$1,250,000</h3>
              <p class="text-secondary-500 mb-2">4 bd | 3 ba | 2,500 sqft</p>
              <p class="text-secondary-700">123 Main Street, City, State</p>
            </div>
          </div>

          <!-- Repeat Property Card 2 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative pb-[66%]">
              <img
                src="https://napa-residence.b-cdn.net/wp-content/uploads/2014/05/j-1-1-500x540.webp"
                alt="Property"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="text-xl font-semibold mb-2">$899,000</h3>
              <p class="text-gray-600 mb-2">3 bd | 2 ba | 1,800 sqft</p>
              <p class="text-gray-800">456 Oak Avenue, City, State</p>
            </div>
          </div>

          <!-- Repeat Property Card 3 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative pb-[66%]">
              <img
                src="https://napa-residence.b-cdn.net/wp-content/uploads/2014/05/11.1-500x540.webp"
                alt="Property"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="text-xl font-semibold mb-2">$1,450,000</h3>
              <p class="text-gray-600 mb-2">5 bd | 4 ba | 3,200 sqft</p>
              <p class="text-gray-800">789 Pine Street, City, State</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Listings Section -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4">
          <h2 class="text-3xl font-semibold mb-8">Recent Listings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Listing Card -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
              <div class="relative pb-[75%]">
                <img
                  src="/assets/listing-1.jpg"
                  alt="Listing"
                  class="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-1">$750,000</h3>
                <p class="text-gray-600 text-sm mb-2">3 bd | 2 ba | 1,500 sqft</p>
                <p class="text-gray-800 text-sm">321 Elm Street, City, State</p>
              </div>
            </div>

            <!-- Repeat for more listing cards -->
          </div>
        </div>
      </section>

      <!-- Call to Action Section -->
      <section class="bg-primary-600 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
          <p class="text-xl mb-8 text-primary-100">Connect with our expert agents today</p>
          <button class="bg-white text-primary-700 px-8 py-3 rounded-md font-semibold hover:bg-primary-50 transition-colors">
            Get Started
          </button>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-secondary-800 text-white py-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">About Us</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Company</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Careers</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Resources</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Blog</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Guides</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Legal</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Privacy Policy</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Terms of Service</a></li>
              <li><a href="#" class="text-primary-300 hover:text-primary-100">Accessibility</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Connect</h3>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-300 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.314-.346-.116l-6.38 4.02-2.7-.84c-.58-.183-.593-.577.124-.855l10.55-4.07c.485-.176.915.11.832.832z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Real Estate Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>

  `,
})
export class TotoComponent {
  private _trpc = injectTrpcClient();

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollPosition = window.scrollY;
    const bannerSearch = document.querySelector('.banner-search');

    if (bannerSearch) {
      const bannerPosition = bannerSearch.getBoundingClientRect().top;
      this.showStickyHeader = bannerPosition < 0;
    }
  }
  public triggerRefresh$ = new Subject<void>();
  public showStickyHeader = false;
  public notes$ = this.triggerRefresh$.pipe(
    switchMap(() => this._trpc.note.list.query()),
    shareReplay(1)
  );
  public newNote = '';



  constructor() {
    void waitFor(this.notes$);
    this.triggerRefresh$.next();
  }

}
