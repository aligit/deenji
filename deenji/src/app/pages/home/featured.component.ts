import { Component } from "@angular/core";
import { AsyncPipe, DatePipe, NgFor, NgIf } from "@angular/common";

@Component({
  selector: "app-featured",
  imports: [AsyncPipe, NgFor, DatePipe, NgIf],
  template: `
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
  `,
})
export class FeaturedComponent { }
