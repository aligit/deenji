import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto py-8">
      <h1 class="text-3xl font-bold mb-6">Available Properties</h1>
      <!-- Your properties list content here -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <p>Properties will be displayed here</p>
      </div>
    </div>
  `,
})
export default class PropertiesListComponent { }
