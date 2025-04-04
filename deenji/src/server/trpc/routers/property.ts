// src/server/routers/property.ts
import { publicProcedure, router } from '../trpc';
import { z } from 'zod';
import { Client } from '@elastic/elasticsearch';

// Initialize Elasticsearch client
const client = new Client({
  node: import.meta.env['VITE_ELASTICSEARCH_URL'] || 'http://localhost:9200',
});

export const propertyRouter = router({
  elasticSearch: publicProcedure
    .input(
      z.object({
        q: z.string().min(2),
      })
    )
    .query(async ({ input }) => {
      try {
        if (!input.q || input.q.length < 2) {
          return { suggestions: [] };
        }

        // Perform multi-match query against multiple fields
        const response = await client.search({
          index: 'properties',
          body: {
            size: 10,
            query: {
              multi_match: {
                query: input.q,
                fields: [
                  'title^3', // Boost title matches
                  'description',
                  'amenities',
                ],
                fuzziness: 'AUTO', // Allow for typos
                prefix_length: 1,
              },
            },
            _source: [
              'id',
              'title',
              'price',
              'bedrooms',
              'bathrooms',
              'area',
              'amenities',
              'location',
              'year_built',
            ],
          },
        });

        return {
          suggestions: response.hits.hits,
        };
      } catch (error) {
        console.error('Error searching properties:', error);
        return {
          suggestions: [],
        };
      }
    }),
});
