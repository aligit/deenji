import { z } from 'zod';

// Define property type enum to support Persian values
export const propertyTypeEnum = z
  .enum([
    'آپارتمان', // Apartment
    'ویلا', // Villa
    'خانه', // House
    'زمین', // Land
  ])
  .or(z.string());

// Property image schema
export const propertyImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export const propertySchema = z.object({
  id: z.union([z.number(), z.string()]),
  external_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number(),
  price_per_meter: z.number().optional(),
  type: propertyTypeEnum.optional(),
  property_type: propertyTypeEnum.optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  area: z.number().optional(),
  year_built: z.number().int().optional(),

  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
      city: z.string().optional(),
      district: z.string().optional(),
    })
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),

  // Additional building information
  floor_number: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  units_per_floor: z.number().int().optional(),
  floor_info: z.string().optional(), // From Elasticsearch: "۵"

  // Property features
  has_elevator: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  has_storage: z.boolean().optional(),
  has_balcony: z.boolean().optional(),

  // Interior details
  floor_material: z.string().optional(),
  bathroom_type: z.string().optional(),
  cooling_system: z.string().optional(),
  heating_system: z.string().optional(),
  hot_water_system: z.string().optional(),

  // Document information
  title_deed_type: z.string().optional(), // From Elasticsearch: "تکبرگ"
  building_direction: z.string().optional(),
  renovation_status: z.string().optional(), // From Elasticsearch: "بازسازی نشده"

  // Real estate agency data
  agency_name: z.string().optional(),
  agent_name: z.string().optional(),
  agent_id: z.string().uuid().optional(),

  // Analytics data
  investment_score: z.number().int().min(0).max(100).optional(),
  market_trend: z.enum(['Rising', 'Stable', 'Declining']).optional(),
  neighborhood_fit_score: z.number().optional(),
  rent_to_price_ratio: z.number().optional(),

  // Dynamic attributes and highlights
  attributes: z.record(z.any()).optional(),
  highlight_flags: z.array(z.string()).optional(),

  // Images relation - support both field names
  images: z.array(z.string()).optional(),
  image_urls: z.array(z.string()).optional(), // From Elasticsearch

  // User tracking
  owner_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Property search query schema
export const propertySearchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
  sortBy: z
    .enum(['price', 'date', 'relevance', 'area', 'created_at'])
    .optional()
    .default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Add property_type to fix the error in your test
  property_type: propertyTypeEnum.optional(),

  // Filter fields
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBedrooms: z.number().int().optional(),
  maxBedrooms: z.number().int().optional(),
  minBathrooms: z.number().int().optional(),
  maxBathrooms: z.number().int().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  minYearBuilt: z.number().int().optional(),
  maxYearBuilt: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
      distance: z.number().optional().default(10),
    })
    .optional(),
});

// Multi-stage search query schema for the guided search flow
export const multiStageSearchQuerySchema = z.object({
  stage: z.enum(['property_type', 'bedrooms', 'price']),
  location: z.string().optional(), // Pre-selected location
  property_type: propertyTypeEnum.optional(),
  bedrooms: z.number().int().min(1).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
});

// Schema for search suggestions query
export const searchSuggestionsQuerySchema = z.object({
  q: z.string().min(1),
  stage: z.enum(['property_type', 'bedrooms', 'price']).optional(),
  context: z.record(z.string(), z.union([z.string(), z.number()])).optional(), // For contextual suggestions
  limit: z.number().int().positive().optional().default(10),
});

// Property search suggestion response type
export const suggestionTypeSchema = z.enum([
  'location',
  'property_type',
  'bedrooms',
  'price_range',
  'property',
  'filter',
  'combination',
]);

// Schema for a single search suggestion
export const searchSuggestionSchema = z.object({
  type: suggestionTypeSchema,
  text: z.string(),
  query: z.string(),
  count: z.number().int().optional(),
  filter: z
    .object({
      field: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
    .optional(),
  context: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

// Export types derived from schemas
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;
export type MultiStageSearchQuery = z.infer<typeof multiStageSearchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<
  typeof searchSuggestionsQuerySchema
>;
export type SuggestionType = z.infer<typeof suggestionTypeSchema>;
export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type Property = z.infer<typeof propertySchema>;
export type PropertyType = z.infer<typeof propertyTypeEnum>;
