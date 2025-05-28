// src/server/trpc/routers/property.ts
import { publicProcedure, router } from '../trpc';
import { z } from 'zod';
import {
  propertySearchQuerySchema,
  searchSuggestionsQuerySchema,
} from '../schemas/property.schema';
import { elasticsearchService } from '../../services/elasticsearch.service';
import { TRPCError } from '@trpc/server';
import { db } from '../../../db';

export const propertyRouter = router({
  // src/server/trpc/routers/property.ts
  search: publicProcedure
    .input(propertySearchQuerySchema)
    .query(async ({ input }) => {
      console.log('➡️ property.search input:', JSON.stringify(input, null, 2));
      try {
        const result = await elasticsearchService.searchProperties(input);
        console.log('✅ ES searchProperties result:', result);
        return result;
      } catch (err) {
        console.error('❌ Elasticsearch error in searchProperties:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search properties',
          cause: err,
        });
      }
    }),

  // Get search suggestions as user types
  suggestions: publicProcedure
    .input(searchSuggestionsQuerySchema)
    .query(async ({ input }) => {
      try {
        const suggestions = await elasticsearchService.getSuggestions(input);
        return { suggestions };
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get search suggestions',
          cause: error,
        });
      }
    }),

  // Get a single property by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const property = await elasticsearchService.getPropertyById(input.id);

        if (!property) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Property with ID ${input.id} not found`,
          });
        }

        return property;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error('Error fetching property by ID:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch property',
          cause: error,
        });
      }
    }),

  // Get property type suggestions
  getPropertyTypeSuggestions: publicProcedure
    .input(
      z.object({
        q: z.string().min(2),
        location: z.string(),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        // Property types in Persian
        const propertyTypes = [
          {
            type: 'property_type',
            text: 'آپارتمان',
            query: 'آپارتمان',
            count: 1250,
          },
          { type: 'property_type', text: 'ویلا', query: 'ویلا', count: 450 },
          { type: 'property_type', text: 'خانه', query: 'خانه', count: 780 },
          { type: 'property_type', text: 'زمین', query: 'زمین', count: 320 },
        ];

        // Filter based on query
        const filtered = propertyTypes
          .filter((pt) => pt.text.includes(input.q))
          .slice(0, input.limit);

        return { suggestions: filtered };
      } catch (error) {
        console.error('Error getting property type suggestions:', error);
        return { suggestions: [] };
      }
    }),

  // Get bedroom suggestions based on property type
  getBedroomSuggestions: publicProcedure
    .input(
      z.object({
        propertyType: z.string(),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        // Bedroom options
        const bedroomOptions = [
          { type: 'bedrooms', text: '۱خوابه', query: '۱خوابه', count: 320 },
          { type: 'bedrooms', text: '۲خوابه', query: '۲خوابه', count: 580 },
          { type: 'bedrooms', text: '۳خوابه', query: '۳خوابه', count: 420 },
          { type: 'bedrooms', text: '۴خوابه', query: '۴خوابه', count: 150 },
          {
            type: 'bedrooms',
            text: '۵خوابه یا بیشتر',
            query: '۵خوابه',
            count: 80,
          },
        ];

        return { suggestions: bedroomOptions.slice(0, input.limit) };
      } catch (error) {
        console.error('Error getting bedroom suggestions:', error);
        return { suggestions: [] };
      }
    }),

  // Get price range suggestions
  getPriceSuggestions: publicProcedure
    .input(
      z.object({
        propertyType: z.string(),
        bedrooms: z.number().optional(),
        location: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Price range suggestions
        const priceSuggestions = [
          {
            type: 'price_range' as const,
            text: 'تا ۵ میلیارد',
            query: 'تا ۵ میلیارد',
            filter: { field: 'price', max: 5000000000 },
          },
          {
            type: 'price_range' as const,
            text: 'بین ۵ تا ۱۰ میلیارد',
            query: 'بین ۵ تا ۱۰ میلیارد',
            filter: { field: 'price', min: 5000000000, max: 10000000000 },
          },
          {
            type: 'price_range' as const,
            text: 'بین ۱۰ تا ۲۰ میلیارد',
            query: 'بین ۱۰ تا ۲۰ میلیارد',
            filter: { field: 'price', min: 10000000000, max: 20000000000 },
          },
          {
            type: 'price_range' as const,
            text: 'بالای ۲۰ میلیارد',
            query: 'بالای ۲۰ میلیارد',
            filter: { field: 'price', min: 20000000000 },
          },
        ];

        return { suggestions: priceSuggestions };
      } catch (error) {
        console.error('Error getting price suggestions:', error);
        return { suggestions: [] };
      }
    }),

  // For backward compatibility - simple search endpoint
  elasticSearch: publicProcedure
    .input(
      z.object({
        q: z.string().min(2),
      })
    )
    .query(async ({ input }) => {
      try {
        // Just call the more comprehensive suggestions method
        const suggestions = await elasticsearchService.getSuggestions({
          q: input.q,
          limit: 10,
        });

        return { suggestions };
      } catch (error) {
        console.error('Error in elasticSearch:', error);
        return { suggestions: [] };
      }
    }),
});
