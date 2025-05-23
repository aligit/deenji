// src/server/trpc/routers/property.ts
import { publicProcedure, router } from '../trpc';
import { z } from 'zod';
import {
  propertySearchQuerySchema,
  searchSuggestionsQuerySchema,
} from '../schemas/property.schema';
import { elasticsearchService } from '../../services/elasticsearch.service';
import { TRPCError } from '@trpc/server';

export const propertyRouter = router({
  // Search properties with flexible filtering and pagination
  search: publicProcedure
    .input(propertySearchQuerySchema)
    .query(async ({ input }) => {
      try {
        return await elasticsearchService.searchProperties(input);
      } catch (error) {
        console.error('Error searching properties:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search properties',
          cause: error,
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

  // For backward compatibility - simple search endpoint
  elasticSearch: publicProcedure
    .input(z.object({
      q: z.string().min(2),
    }))
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
