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

  getById: publicProcedure
    .input(
      z.object({
        // Allow both string and number IDs
        id: z.union([z.string(), z.number()]),
      })
    )
    .query(async ({ input }) => {
      try {
        const property = await elasticsearchService.getPropertyById(input.id);

        if (!property) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Property not found',
          });
        }

        return property;
      } catch (error) {
        console.error('Error fetching property by ID:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch property details',
        });
      }
    }),

  getSimilarProperties: publicProcedure
    .input(
      z.object({
        propertyId: z.number(),
        limit: z.number().optional().default(4),
      })
    )
    .query(async ({ input }) => {
      try {
        // First get the current property to understand its characteristics
        const currentProperty = await elasticsearchService.getPropertyById(
          input.propertyId
        );

        if (!currentProperty) {
          return { properties: [] };
        }

        // Build a search query for similar properties
        const similarQuery = {
          property_type: currentProperty.type,
          minPrice: currentProperty.price
            ? currentProperty.price * 0.7
            : undefined,
          maxPrice: currentProperty.price
            ? currentProperty.price * 1.3
            : undefined,
          minBedrooms: currentProperty.bedrooms
            ? Math.max(1, currentProperty.bedrooms - 1)
            : undefined,
          maxBedrooms: currentProperty.bedrooms
            ? currentProperty.bedrooms + 1
            : undefined,
          page: 1,
          pageSize: input.limit + 1,
          sortBy: 'relevance' as const,
          sortOrder: 'desc' as const,
        };

        const searchResult = await elasticsearchService.searchProperties(
          similarQuery
        );

        // Filter out the current property from results
        const similarProperties = searchResult.results
          .filter((prop) => prop.id !== currentProperty.id)
          .slice(0, input.limit);

        return { properties: similarProperties };
      } catch (error) {
        console.error('Error fetching similar properties:', error);
        return { properties: [] };
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

  getEstimatedValue: publicProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      // Base value for randomization (in billions)
      const baseValue = Math.floor(Math.random() * 20 + 5) * 1000000000; // 5B to 25B
      const variance = baseValue * 0.1; // 10% variance for range

      return {
        estimatedValue: baseValue,
        priceRangeMin: baseValue - variance,
        priceRangeMax: baseValue + variance,
        rentEstimate: Math.floor(baseValue * 0.005), // 0.5% of value as monthly rent
      };
    }),

  // New endpoint: Get Price History
  getPriceHistory: publicProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      const currentYear = 1402; // Persian year for demo
      const basePrice = Math.floor(Math.random() * 15 + 5) * 1000000000; // 5B to 20B starting point
      const history = [];

      for (let year = 1400; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month += 6) {
          // Every 6 months
          if (year === currentYear && month > 1) break; // Stop at 1402/01
          const date = `${year}/${month.toString().padStart(2, '0')}`;
          const growthFactor = (year - 1400 + month / 12) * 0.15; // 15% annual growth
          const price = Math.floor(basePrice * (1 + growthFactor));
          history.push({ date, price });
        }
      }
      return history;
    }),
});
