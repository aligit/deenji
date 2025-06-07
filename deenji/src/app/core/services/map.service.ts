// src/app/core/services/map.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  // Signal for the currently highlighted property
  highlightedPropertyId = signal<string | null>(null);

  // Method to highlight a property
  highlightProperty(propertyId: string | null) {
    console.log('Highlighting property:', propertyId);
    this.highlightedPropertyId.set(propertyId);
  }
}
