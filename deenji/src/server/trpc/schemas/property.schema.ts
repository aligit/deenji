// src/server/trpc/schemas/property.schema.ts
import { z } from 'zod';

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

// Schema for search suggestions query
export const searchSuggestionsQuerySchema = z.object({
  q: z.string().min(2),
  limit: z.number().int().positive().optional().default(5),
});

// Property search suggestion response type
export const suggestionTypeSchema = z.enum([
  'location',
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
});

// Property details schema
export const propertySchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
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
});

// Export types derived from schemas
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;
export type SearchSuggestionsQuery = z.infer<
  typeof searchSuggestionsQuerySchema
>;
export type SuggestionType = z.infer<typeof suggestionTypeSchema>;
export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type Property = z.infer<typeof propertySchema>;
