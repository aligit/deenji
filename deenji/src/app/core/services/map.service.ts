// src/app/core/services/map.service.ts
import { Injectable, signal } from '@angular/core';
import { PropertyResult } from '../types/property.types';

export interface Marker {
  position: {
    lat: number;
    lng: number;
  };
  property?: any;
  id: string | number;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  // Use a signal to track the highlighted property ID
  private _highlightedPropertyId = signal<string | number | null>(null);

  // Expose a readonly version of the signal
  public get highlightedPropertyId() {
    return this._highlightedPropertyId;
  }

  // Method to highlight a property
  highlightProperty(propertyId: string | number) {
    // Validate property ID
    if (propertyId === null || propertyId === undefined) {
      console.warn('Cannot highlight: Property ID is null or undefined');
      return;
    }

    // Update the signal with the property ID
    this._highlightedPropertyId.set(propertyId);
    console.log(`Highlighted property: ${propertyId}`);
  }

  // Clear the highlighted property
  clearHighlightedProperty() {
    this._highlightedPropertyId.set(null);
  }

  // Store properties by ID for quick lookup
  private propertiesById = new Map<string, PropertyResult>();

  // Method to set all properties for lookup
  setProperties(properties: PropertyResult[]) {
    // Clear existing properties
    this.propertiesById.clear();

    // Add each property to the map using string IDs
    properties.forEach((property) => {
      if (property && property.id) {
        this.propertiesById.set(property.id.toString(), property);
      }
    });
  }

  // Get a property by ID
  getPropertyById(id: string | number): PropertyResult | undefined {
    return this.propertiesById.get(id.toString());
  }
}
