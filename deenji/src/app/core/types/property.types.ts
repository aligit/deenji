// src/app/core/types/property.types.ts
export interface PropertyBase {
  // Allow both string and number for id
  id: string | number;
  external_id?: string;
  title: string;
  description?: string;
  price: number;
  address?: string;
  price_per_meter?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  location?: {
    lat: number;
    lon: number;
    city?: string;
  };
  images?: string[];
  district?: string;
  city?: string;
  property_type?: string;
  has_elevator?: boolean;
  has_parking?: boolean;
  has_storage?: boolean;
  has_balcony?: boolean;
  investment_score?: number;
}

export type PropertyResult = PropertyBase;

export interface PropertyDetail extends PropertyBase {
  // Agent information
  agent_name?: string;
  agency_name?: string;
  agent_id?: string;

  // Property type and classification
  type?: string; // Alternative to property_type

  // Building details
  year_built?: number;
  floor_info?: string; // From Elasticsearch: "۵"
  total_floors?: number;
  floor_number?: number;
  units_per_floor?: number;

  // Legal and documentation
  title_deed_type?: string; // From Elasticsearch: "تکبرگ", "تک‌برگ", etc.
  renovation_status?: string; // From Elasticsearch: "بازسازی نشده", etc.
  building_direction?: string;

  // Interior and building features
  floor_material?: string;
  bathroom_type?: string;
  cooling_system?: string;
  heating_system?: string;
  hot_water_system?: string;

  // Analytics and market data
  market_trend?: string;
  neighborhood_fit_score?: number;
  rent_to_price_ratio?: number;

  // Dynamic attributes
  attributes?: Record<string, any>;
  highlight_flags?: string[];

  // Legacy fields
  amenities?: string[];
  features?: string[];
  energy_rating?: string;

  // Related properties
  similar_properties?: PropertyResult[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}
