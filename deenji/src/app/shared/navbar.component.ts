import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, AngularSvgIconModule],
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
`
})
export class NavbarComponent { }
