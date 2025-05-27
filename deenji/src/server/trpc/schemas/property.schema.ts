// src/server/trpc/schemas/property.schema.ts
import { z } from 'zod';

// Define property type enum to support Persian values
export const propertyTypeEnum = z
  .enum([
    'آپارتمان', // Apartment
    'ویلا', // Villa
    'خانه', // House
    'زمین', // Land
    // Allow other values for flexibility
  ])
  .or(z.string());

// Property search query schema
export const propertySearchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
  sortBy: z
    .enum(['price', 'date', 'relevance'])
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

// Property details schema
export const propertySchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  property_type: propertyTypeEnum.optional(), // Added property_type
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  area: z.number().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  year_built: z.number().int().optional(),
  // Additional fields from your DB schema
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  floor_number: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  has_elevator: z.boolean().optional(),
  has_parking: z.boolean().optional(),
  has_storage: z.boolean().optional(),
  has_balcony: z.boolean().optional(),
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
