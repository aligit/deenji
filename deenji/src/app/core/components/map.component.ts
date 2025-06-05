import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleMap,
  GoogleMapsModule,
  MapMarker,
  MapInfoWindow,
} from '@angular/google-maps';
import { signal } from '@angular/core';

interface PropertyLocation {
  lat: number;
  lon: number;
}

interface PropertyMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
}

@Component({
  selector: 'app-map',
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="map-container h-full w-full">
      <google-map
        [center]="center"
        [zoom]="zoom"
        [options]="options"
        height="100%"
        width="100%"
        (mapClick)="closeInfoWindow()"
      >
        @for (marker of markers(); track marker.id) {
        <map-marker
          [position]="marker.position"
          [title]="marker.title"
          [options]="getMarkerOptions(marker.id)"
          (mapClick)="openInfoWindow(marker)"
        ></map-marker>
        }

        <map-info-window>
          <div dir="rtl" class="info-content">
            <h3 class="text-base font-semibold">
              {{ selectedProperty?.title }}
            </h3>
            <p class="text-sm font-bold text-primary-600">
              {{ formatPrice(selectedProperty?.price || 0) }} تومان
            </p>
            @if (selectedProperty?.bedrooms) {
            <p class="text-xs">{{ selectedProperty.bedrooms }} خواب</p>
            } @if (selectedProperty?.area) {
            <p class="text-xs">{{ selectedProperty.area }} متر</p>
            }
            <a
              href="/properties/{{ selectedProperty?.id }}"
              class="text-xs text-blue-600 mt-2 block"
              >مشاهده جزئیات</a
            >
          </div>
        </map-info-window>
      </google-map>
    </div>
  `,
  styles: `
    .map-container {
      min-height: 400px;
    }

    :host {
      display: block;
      height: 100%;
    }

    .info-content {
      padding: 8px;
      max-width: 200px;
    }
  `,
})
export class MapComponent implements OnChanges {
  @Input() properties: any[] = [];
  @Input() highlightedPropertyId: string | null = null;

  @Output() markerClick = new EventEmitter<string>();

  markers = signal<PropertyMarker[]>([]);
  selectedProperty: any = null;

  // Default center (District 5, Tehran)
  center: google.maps.LatLngLiteral = { lat: 35.7219, lng: 51.389 };
  zoom = 14;

  // Map options
  options: google.maps.MapOptions = {
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  };

  // Reference to the info window
  infoWindow = new google.maps.InfoWindow();

  ngOnChanges(changes: SimpleChanges) {
    // When properties change, update markers
    if (changes['properties']) {
      this.updateMarkers();
    }

    // When highlighted property changes, handle marker highlight
    if (changes['highlightedPropertyId'] && this.highlightedPropertyId) {
      this.centerOnPropertyId(this.highlightedPropertyId);
    }
  }

  updateMarkers() {
    if (this.properties.length === 0) {
      this.markers.set([]);
      return;
    }

    // Create markers for each property
    const newMarkers: PropertyMarker[] = this.properties
      .filter((p) => p.location?.lat && p.location?.lon)
      .map((property) => ({
        id: property.id,
        position: {
          lat: property.location.lat,
          lng: property.location.lon,
        },
        title: property.title,
      }));

    this.markers.set(newMarkers);

    // Center on first result if available
    if (newMarkers.length > 0) {
      this.center = newMarkers[0].position;
      this.zoom = 14;
    }
  }

  openInfoWindow(marker: PropertyMarker) {
    // Find property details
    const property = this.properties.find((p) => p.id === marker.id);
    if (!property) return;

    // Set the selected property
    this.selectedProperty = property;

    // Emit event to parent component
    this.markerClick.emit(marker.id);
  }

  closeInfoWindow() {
    this.selectedProperty = null;
  }

  formatPrice(price: number): string {
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد`;
    } else if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(0)} میلیون`;
    }
    return price.toLocaleString('fa-IR');
  }

  centerOnPropertyId(propertyId: string) {
    const marker = this.markers().find((m) => m.id === propertyId);
    if (marker) {
      this.center = marker.position;
      this.zoom = 16; // Zoom in a bit more to highlight

      // Find and select the property
      const property = this.properties.find((p) => p.id === propertyId);
      if (property) {
        this.selectedProperty = property;
      }
    }
  }

  getMarkerOptions(markerId: string): google.maps.MarkerOptions {
    const isHighlighted = markerId === this.highlightedPropertyId;

    return {
      animation: isHighlighted ? google.maps.Animation.BOUNCE : null,
      opacity: isHighlighted ? 1 : 0.8,
      icon: isHighlighted
        ? {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(40, 40),
        }
        : undefined,
    };
  }
}
