// deenji/src/app/core/components/map.component.ts
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { MapService } from '../services/map.service';
import { Router } from '@angular/router';
import { PropertyResult } from '../../core/types/property.types';

interface MapMarkerData {
  position: {
    lat: number;
    lng: number;
  };
  property: PropertyResult;
  id: string | number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMap, MapMarker, MapInfoWindow],
  template: `
    <div class="map-container">
      <google-map
        #map
        [center]="center"
        [zoom]="zoom"
        [options]="mapOptions"
        class="w-full h-full"
      >
        <!-- Property markers -->
        @for (marker of markers(); track marker.id) {
        <map-marker
          [position]="marker.position"
          [options]="getMarkerOptions(marker)"
          (mapClick)="onMarkerClick(marker)"
        />
        }

        <!-- Info window -->
        <map-info-window #infoWindow>
          @if (selectedProperty(); as property) {
          <div class="p-3 min-w-[250px]">
            <h4 class="font-semibold text-sm mb-2">{{ property.title }}</h4>
            <p class="text-lg font-bold text-primary-600 mb-2">
              {{ formatPrice(property.price) }} تومان
            </p>

            <div class="flex gap-3 text-xs text-gray-600 mb-3">
              @if (property.bedrooms) {
              <span>{{ property.bedrooms }} خواب</span>
              } @if (property.area) {
              <span>{{ property.area }}م²</span>
              }
            </div>

            <button
              class="bg-primary-600 text-white px-3 py-1 rounded text-xs hover:bg-primary-700"
              (click)="viewPropertyDetails(property.id.toString())"
            >
              مشاهده جزئیات
            </button>
          </div>
          }
        </map-info-window>
      </google-map>
    </div>
  `,
  styles: [
    `
      .map-container {
        width: 100%;
        height: 100%;
        min-height: 400px;
      }

      google-map {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MapComponent implements OnInit, OnChanges {
  @Input() highlightedPropertyId?: number;
  @Input() properties: PropertyResult[] = [];

  // Add the output event that the search page is expecting
  @Output() onMapClick = new EventEmitter<any>();

  @ViewChild('map') map!: GoogleMap;
  @ViewChild('infoWindow') infoWindow!: MapInfoWindow;

  private mapService = inject(MapService);
  private router = inject(Router);

  // Signals
  markers = signal<MapMarkerData[]>([]);
  selectedProperty = signal<PropertyResult | null>(null);
  infoWindowPosition = signal<google.maps.LatLngLiteral>({ lat: 0, lng: 0 });

  // Map configuration
  center: google.maps.LatLngLiteral = { lat: 35.6892, lng: 51.389 }; // Tehran
  zoom = 12;

  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 8,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };

  ngOnInit() {
    this.updateMarkers(this.properties || []);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['properties']) {
      this.updateMarkers(this.properties || []);
      this.adjustMapBounds();
    }

    if (changes['highlightedPropertyId']) {
      this.highlightMarker();
    }
  }

  updateMarkers(properties: PropertyResult[]) {
    const validMarkers: MapMarkerData[] = [];

    properties.forEach((property) => {
      if (property.location?.lat && property.location?.lon) {
        validMarkers.push({
          position: {
            lat: property.location.lat,
            lng: property.location.lon,
          },
          property,
          id: property.id,
        });
      }
    });

    // Use signal's set method instead of direct assignment
    this.markers.set(validMarkers);
  }

  private adjustMapBounds() {
    const markers = this.markers();
    if (markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend(marker.position);
    });

    // Use setTimeout to ensure the map is initialized
    setTimeout(() => {
      if (this.map?.googleMap) {
        this.map.googleMap.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = this.map.googleMap.addListener(
          'bounds_changed',
          () => {
            if (this.map.googleMap!.getZoom()! > 15) {
              this.map.googleMap!.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          }
        );
      }
    }, 100);
  }

  private highlightMarker() {
    // This could be used to change marker appearance for highlighted property
    // Implementation depends on your specific highlighting needs
  }

  getMarkerOptions(marker: MapMarkerData): google.maps.MarkerOptions {
    const isHighlighted = marker.id === this.highlightedPropertyId;

    return {
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isHighlighted ? 12 : 8,
        fillColor: isHighlighted ? '#dc2626' : '#2563eb',
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: isHighlighted ? 1000 : 1,
      animation: isHighlighted ? google.maps.Animation.BOUNCE : undefined,
    };
  }

  // This method handles marker clicks and emits the event
  onMarkerClick(marker: MapMarkerData): void {
    this.selectedProperty.set(marker.property);
    this.infoWindowPosition.set(marker.position);
    this.infoWindow.open();

    // Emit the event that the search page is expecting
    this.onMapClick.emit({
      id: marker.id,
      property: marker.property,
      position: marker.position,
    });
  }

  viewPropertyDetails(propertyId: string | number): void {
    // Add validation to prevent navigation with invalid IDs
    if (propertyId === undefined || propertyId === null || propertyId === '') {
      console.error('Cannot navigate: Property ID is empty or invalid');
      return;
    }

    // Navigate to property details page with the ID as-is (can be string or number)
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/properties', propertyId])
    );
    window.open(url, '_blank');
  }

  formatPrice(price: number): string {
    if (price >= 1_000_000_000) {
      const billions = price / 1_000_000_000;
      return billions % 1 === 0
        ? `${billions} میلیارد`
        : `${billions.toFixed(1)} میلیارد`;
    } else if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      return millions % 1 === 0
        ? `${millions} میلیون`
        : `${millions.toFixed(1)} میلیون`;
    }
    return price.toLocaleString('fa-IR');
  }
}
