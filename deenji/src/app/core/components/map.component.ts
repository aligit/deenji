import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { CommonModule } from '@angular/common';

// Create a simple enum to replace the missing import
enum PropertyFormStatus {
  SOLD = 'SOLD',
  AVAILABLE = 'AVAILABLE',
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMap, MapMarker, MapInfoWindow],
  template: `
    <google-map
      [height]="height()"
      [width]="width()"
      [center]="center"
      [zoom]="14"
      [options]="mapOptions"
      (mapClick)="onMapClick($event)"
      (mapInitialized)="onMapInitialized($event)"
    >
      @for (marker of markers(); track marker.id || $index) {
      <map-marker
        [position]="marker.position"
        [options]="marker.options"
        [title]="marker.title"
        (mapClick)="onMarkerClick(marker)"
        #markerRef
      />
      }

      <map-info-window [position]="infoWindowPosition()" #infoWindow>
        @if (selectedProperty()) {
        <div class="info-window-content">
          <h3>{{ selectedProperty()!.title }}</h3>
          <p>{{ formatPrice(selectedProperty()!.price) }} تومان</p>
          @if (selectedProperty()!.bedrooms) {
          <p>{{ selectedProperty()!.bedrooms }} خواب</p>
          } @if (selectedProperty()!.area) {
          <p>{{ selectedProperty()!.area }} متر</p>
          }
          <button (click)="viewPropertyDetails(selectedProperty()!.id)">
            مشاهده جزئیات
          </button>
        </div>
        }
      </map-info-window>
    </google-map>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .info-window-content {
        padding: 10px;
        max-width: 200px;
      }

      .info-window-content h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
      }

      .info-window-content p {
        margin: 0 0 10px 0;
        font-size: 14px;
      }

      .info-window-content button {
        background-color: #4285f4;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .info-window-content button:hover {
        background-color: #357ae8;
      }

      ::ng-deep .gm-style .gm-style-iw-c {
        padding: 0;
      }

      ::ng-deep .gm-style .gm-style-iw-d {
        overflow: hidden !important;
      }
    `,
  ],
})
export class MapComponent implements OnInit, OnChanges {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
  @ViewChild(GoogleMap) map!: GoogleMap;

  @Input() properties: any[] = [];
  @Input() selectedPropertyId?: string;
  @Input() showCurrentLocation = false;
  @Input() enablePropertyCreation = false;
  @Input() highlightedPropertyId?: string;

  // Map dimensions
  height = signal('100%');
  width = signal('100%');

  // Map state
  // Centered on District 5
  center: google.maps.LatLngLiteral = { lat: 35.7219, lng: 51.389 };
  public fixedZoom = 14;

  // Map options with fixed zoom
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: true,
    scrollwheel: true,
    gestureHandling: 'cooperative',
    disableDoubleClickZoom: false,
    mapTypeId: 'roadmap',
    restriction: {
      latLngBounds: {
        north: 35.82235,
        south: 35.699129,
        east: 51.342,
        west: 51.24944,
      },
      strictBounds: false,
    },
    minZoom: 12,
    maxZoom: 18,
  };

  // Google Maps instance
  mapInstance?: google.maps.Map;

  // Markers
  markers = signal<any[]>([]);

  // Info window state
  selectedProperty = signal<any>(null);
  infoWindowPosition = signal<google.maps.LatLngLiteral>({ lat: 0, lng: 0 });

  ngOnInit(): void {
    if (this.properties.length > 0) {
      this.updateMarkers();
    }

    // If there's a selected property, center on it
    if (this.selectedPropertyId) {
      this.centerOnProperty(this.selectedPropertyId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties']) {
      this.updateMarkers();
    }

    if (changes['selectedPropertyId'] && this.selectedPropertyId) {
      this.centerOnProperty(this.selectedPropertyId);
    }

    if (changes['highlightedPropertyId'] && this.highlightedPropertyId) {
      const property = this.properties.find(
        (p) => p.id === this.highlightedPropertyId
      );
      if (property) {
        this.selectedProperty.set(property);
      }
    }
  }

  onMapInitialized(map: google.maps.Map): void {
    this.mapInstance = map;
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (this.enablePropertyCreation && event.latLng) {
      // Instead of using PropertyFormService, just log the location
      console.log('Create property at:', {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });

      // Add a temporary marker at the clicked location
      this.addTemporaryMarker(event.latLng.lat(), event.latLng.lng());
    }
  }

  onMarkerClick(marker: any): void {
    this.selectedProperty.set(marker.property);
    this.infoWindowPosition.set(marker.position);
    this.infoWindow.open();

    // Emit an event to highlight the corresponding list item
    // You can use a service or event emitter to communicate with the list component
  }

  viewPropertyDetails(propertyId: string): void {
    // Navigate to property details page
    // This would typically use the Router service
    console.log('View property details:', propertyId);
  }

  private updateMarkers(): void {
    if (!this.properties || this.properties.length === 0) {
      this.markers.set([]);
      return;
    }

    // Add logging to debug coordinates
    console.log('Updating markers with properties:', this.properties);

    const newMarkers = this.properties
      .filter((property) => {
        // Make sure we have valid coordinates
        const hasValidLat =
          property.latitude && !isNaN(parseFloat(property.latitude));
        const hasValidLng =
          property.longitude && !isNaN(parseFloat(property.longitude));
        return hasValidLat && hasValidLng;
      })
      .map((property) => ({
        id: property.id,
        position: {
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude),
        },
        title: property.title,
        property: property,
        options: {
          animation: google.maps.Animation.DROP,
          icon: this.getMarkerIcon(property),
        },
      }));

    console.log('Created markers:', newMarkers);
    this.markers.set(newMarkers);

    // Center map on first property if available (per user story)
    if (newMarkers.length > 0) {
      this.centerOnFirstProperty(newMarkers[0]);
    }
  }

  private centerOnFirstProperty(marker: any): void {
    if (this.mapInstance) {
      // Center on the marker
      this.mapInstance.panTo(marker.position);

      // Only set zoom if it's too low (per user story: zoom ≥ 14)
      const currentZoom = this.mapInstance.getZoom() || 14;
      if (currentZoom < 14) {
        this.mapInstance.setZoom(14);
      }

      // Optionally open info window for first marker
      this.selectedProperty.set(marker.property);
      this.infoWindowPosition.set(marker.position);
      this.infoWindow.open();
    }
  }

  private centerOnProperty(propertyId: string): void {
    const property = this.properties.find((p) => p.id === propertyId);
    if (property && property.latitude && property.longitude) {
      this.center = {
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
      };

      // If map is initialized, pan to the new center
      if (this.mapInstance) {
        this.mapInstance.panTo(this.center);
      }
    }
  }

  private getMarkerIcon(property: any): google.maps.Symbol {
    // Customize marker icon based on property status
    const color =
      property.status === PropertyFormStatus.SOLD ? '#FF0000' : '#00FF00';

    return {
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 8,
      // Use Symbol instead of path
      path: google.maps.SymbolPath.CIRCLE,
    };
  }

  // Public methods for external control

  public panToLocation(lat: number, lng: number): void {
    this.center = { lat, lng };
    if (this.mapInstance) {
      this.mapInstance.panTo(this.center);
    }
  }

  public addTemporaryMarker(lat: number, lng: number): void {
    const tempMarker = {
      id: 'temp-' + Date.now(),
      position: { lat, lng },
      title: 'New Property Location',
      property: null,
      options: {
        animation: google.maps.Animation.BOUNCE,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FFA500',
          fillOpacity: 0.8,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      },
    };

    this.markers.update((markers) => [...markers, tempMarker]);
  }

  public removeTemporaryMarkers(): void {
    this.markers.update((markers) =>
      markers.filter((m) => !m.id.startsWith('temp-'))
    );
  }
  // In the map component
  formatPrice(price: number): string {
    if (!price) return '';

    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد`;
    } else if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(0)} میلیون`;
    }
    return price.toLocaleString('fa-IR');
  }
}
