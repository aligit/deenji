// src/server/types/elasticsearch.types.ts
import {
  AggregationsAvgAggregate,
  AggregationsRangeAggregate,
  AggregationsStringTermsAggregate,
  AggregationsLongTermsAggregate,
  AggregationsHistogramAggregate,
} from '@elastic/elasticsearch/lib/api/types';

// src/server/types/elasticsearch.types.ts
export interface ElasticsearchSource {
  id: string | number;
  title: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  description?: string;
  amenities?: string[];
  location?: {
    lat: number;
    lon: number;
  };
  year_built?: number;
  // Add these missing fields:
  property_type?: string;
  district?: string;
  city?: string;
  address?: string;
  has_elevator?: boolean;
  has_parking?: boolean;
  has_storage?: boolean;
  has_balcony?: boolean;
  investment_score?: number;
  price_per_meter?: number;
  external_id?: string;
  image_urls?: string[];
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
