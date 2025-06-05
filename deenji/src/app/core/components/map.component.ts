import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleMapsModule,
  MapMarker,
  MapInfoWindow,
} from '@angular/google-maps';
import { signal } from '@angular/core';

interface PropertyMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="map-container h-full w-full">
      @if (apiLoaded) {
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
          #markerElem
          [position]="marker.position"
          [title]="marker.title"
          [options]="getMarkerOptions(marker.id)"
          (mapClick)="openInfoWindow(marker)"
        ></map-marker>
        }

        <map-info-window #infoWindow>
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
      } @else {
      <div class="flex items-center justify-center h-full">
        <p class="text-gray-500">در حال بارگذاری نقشه...</p>
      </div>
      }
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
export class MapComponent implements OnInit, OnChanges {
  @ViewChild('infoWindow') infoWindow!: MapInfoWindow;

  @Input() properties: any[] = [];
  @Input() highlightedPropertyId: string | null = null;
  @Output() markerClick = new EventEmitter<string>();

  markers = signal<PropertyMarker[]>([]);
  selectedProperty: any = null;
  apiLoaded = false;

  // Default center (District 5, Tehran)
  center: google.maps.LatLngLiteral = { lat: 35.7219, lng: 51.389 };
  zoom = 14.568499456622654;

  // Initialize options as empty object, will be set in ngOnInit
  options: google.maps.MapOptions = {};

  ngOnInit() {
    // Check if Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeMap();
    } else {
      // If not loaded, wait for it
      this.waitForGoogleMaps();
    }
  }

  private waitForGoogleMaps() {
    const checkInterval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        clearInterval(checkInterval);
        this.initializeMap();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.apiLoaded) {
        console.error('Google Maps failed to load');
      }
    }, 10000);
  }

  private initializeMap() {
    // Now it's safe to use google.maps
    this.options = {
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
    };

    this.apiLoaded = true;

    // Update markers if properties are already loaded
    if (this.properties.length > 0) {
      this.updateMarkers();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['properties'] && this.apiLoaded) {
      this.updateMarkers();
    }

    if (
      changes['highlightedPropertyId'] &&
      this.highlightedPropertyId &&
      this.apiLoaded
    ) {
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
    const property = this.properties.find((p) => p.id === marker.id);
    if (!property) return;

    this.selectedProperty = property;
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

    // Always return a valid MarkerOptions object
    const options: google.maps.MarkerOptions = {
      animation: isHighlighted ? google.maps.Animation.BOUNCE : undefined,
      opacity: isHighlighted ? 1 : 0.8,
    };

    // Only add custom icon if highlighted
    if (isHighlighted && this.apiLoaded) {
      options.icon = {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: { width: 40, height: 40 } as any, // Cast to any to avoid type issues
      };
    }

    return options;
  }
}
