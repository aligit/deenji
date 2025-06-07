// src/server/types/elasticsearch.types.ts
import {
  AggregationsAvgAggregate,
  AggregationsRangeAggregate,
  AggregationsStringTermsAggregate,
  AggregationsLongTermsAggregate,
  AggregationsHistogramAggregate,
} from '@elastic/elasticsearch/lib/api/types';

export interface ElasticsearchLocation {
  neighborhood?: string;
  district?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

// Enhanced ElasticsearchSource interface with all property fields
export interface ElasticsearchSource {
  id: string | number;
  external_id?: string;
  title: string;
  description?: string;
  price?: number;
  price_per_meter?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  year_built?: number;

  // Location data
  location?: ElasticsearchLocation;
  address?: string;
  district?: string;
  city?: string;

  // Building details
  floor_number?: number;
  total_floors?: number;
  units_per_floor?: number;

  // Property features
  has_elevator?: boolean;
  has_parking?: boolean;
  has_storage?: boolean;
  has_balcony?: boolean;

  // Interior details
  floor_material?: string;
  bathroom_type?: string;
  cooling_system?: string;
  heating_system?: string;
  hot_water_system?: string;

  // Document information
  title_deed_type?: string;
  building_direction?: string;
  renovation_status?: string;

  // Real estate agency data
  agency_name?: string;
  agent_name?: string;
  agent_id?: string;

  // Analytics data
  investment_score?: number;
  market_trend?: string;
  neighborhood_fit_score?: number;
  rent_to_price_ratio?: number;

  // Dynamic data
  attributes?: Record<string, any>;
  highlight_flags?: string[];

  // Images and media
  image_urls?: string[];

  // Other legacy fields
  amenities?: string[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface RangeBucket {
  key: string;
  from?: number;
  to?: number;
  doc_count: number;
}

export interface RangeAggregation {
  buckets: RangeBucket[];
}

// Expand your existing SearchSuggestion type
export interface SearchSuggestion {
  type: string;
  text: string;
  query: string;
  count: number;
  filter?: {
    field: string;
    value?: number | string;
    // Add these fields explicitly
    min?: number;
    max?: number;
  };
}

// Define HitSource type for mapping Elasticsearch results
export interface HitSource {
  _source: ElasticsearchSource;
  _id: string;
  _score?: number;
}

// Define bucket types for aggregations
export interface AggregationBucket {
  key: string | number;
  doc_count: number;
  from?: number;
  to?: number;
}

// Define types for boolean queries
export interface BooleanQuery {
  bool: {
    must?: any[];
    filter?: any[];
    should?: any[];
    must_not?: any[];
  };
}

// Define types for range queries
export interface RangeQuery {
  range: {
    [field: string]: {
      gte?: number;
      lte?: number;
      gt?: number;
      lt?: number;
    };
  };
}

// Define the full aggregations response type
export interface PropertySearchAggregations {
  price_ranges: AggregationsRangeAggregate;
  area_ranges: AggregationsRangeAggregate;
  bedrooms: AggregationsLongTermsAggregate;
  bathrooms: AggregationsStringTermsAggregate;
  average_price: AggregationsAvgAggregate;
  average_area: AggregationsAvgAggregate;
  year_built_histogram: AggregationsHistogramAggregate;
}

// Type for sort options
export type SortOrder = 'asc' | 'desc';
export type SortClause = { [field: string]: { order: SortOrder } } | string;

// Range config for aggregations
export interface RangeConfig {
  field: string;
  ranges: Array<{
    from?: number;
    to?: number;
    key: string;
  }>;
}

// Terms config for aggregations
export interface TermsConfig {
  field: string;
  size: number;
  missing?: string;
  order?: { [key: string]: 'asc' | 'desc' };
}

// Define the aggregation config types
export interface AggregationsConfig {
  price_ranges: { range: RangeConfig };
  area_ranges: { range: RangeConfig };
  bedrooms: { terms: TermsConfig };
  bathrooms: { terms: TermsConfig };
  average_price: { avg: { field: string } };
  average_area: { avg: { field: string } };
  year_built_histogram: {
    histogram: { field: string; interval: number; min_doc_count: number };
  };
}
