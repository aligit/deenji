// src/server/services/elasticsearch.service.ts
import { Client, errors } from '@elastic/elasticsearch';
import { SearchCompletionSuggestOption } from '@elastic/elasticsearch/lib/api/types';
import {
  PropertySearchQuery,
  SearchSuggestionsQuery,
  SearchSuggestion,
  Property,
} from '../trpc/schemas/property.schema';
import {
  AggregationsAvgAggregate,
  AggregationsHistogramAggregate,
  AggregationsLongTermsAggregate,
  AggregationsRangeAggregate,
  AggregationsStringTermsAggregate,
  SearchResponse,
  CountResponse,
  QueryDslQueryContainer,
  QueryDslBoolQuery,
  SortCombinations,
} from '@elastic/elasticsearch/lib/api/types';
import {
  PropertySearchAggregations,
  ElasticsearchSource,
  RangeAggregation,
} from '../types/elasticsearch.types';
import {
  propertyMappings,
  propertySettings,
  suggestionsMappings,
  suggestionsSettings,
} from '../mappings/property.mapping';

// Default index name
const INDEX = 'divar_properties';

// Maximum suggestion count to return
const MAX_SUGGESTIONS = 10;

export interface FullAggregations {
  price_ranges: AggregationsRangeAggregate;
  area_ranges: AggregationsRangeAggregate;
  bedrooms: AggregationsLongTermsAggregate; // This assumes buckets will be AggregationsLongTermsBucket[]
  bathrooms: AggregationsStringTermsAggregate;
  average_price: AggregationsAvgAggregate;
  average_area: AggregationsAvgAggregate;
  year_built_histogram: AggregationsHistogramAggregate;
}

// Add aggregation type helpers
type RangeConfig = {
  field: string;
  ranges: Array<{
    from?: number;
    to?: number;
    key: string;
  }>;
};

type TermsConfig = {
  field: string;
  size: number;
  missing: string;
  order: { _key: 'asc' | 'desc' };
};

type buildAggsReturn = {
  // Range aggregations
  price_ranges: { range: RangeConfig };
  area_ranges: { range: RangeConfig };

  // Terms aggregations
  bedrooms: { terms: TermsConfig };
  bathrooms: { terms: TermsConfig };

  // Average metrics
  average_price: { avg: { field: string } };
  average_area: { avg: { field: string } };

  // Histogram
  year_built_histogram: {
    histogram: { field: string; interval: number; min_doc_count: number };
  };
};

// Create the Elasticsearch client with environment-aware configuration
const client = new Client({
  // Base node URL - this will be used in both dev and prod
  node: import.meta.env['VITE_ELASTICSEARCH_URL'] || 'http://localhost:9200',

  // Auth configuration - only applied in production if credentials are available
  ...(import.meta.env['VITE_ELASTICSEARCH_USERNAME'] &&
  import.meta.env['VITE_ELASTICSEARCH_PASSWORD']
    ? {
        auth: {
          username: import.meta.env['VITE_ELASTICSEARCH_USERNAME'],
          password: import.meta.env['VITE_ELASTICSEARCH_PASSWORD'],
        },
      }
    : {}),

  // TLS configuration for HTTPS connections
  ...(import.meta.env['VITE_ELASTICSEARCH_URL']?.startsWith('https://')
    ? {
        tls: {
          // In development, we might want to bypass certificate validation
          rejectUnauthorized: import.meta.env['NODE_ENV'] === 'production',
        },
      }
    : {}),

  // General client configuration
  requestTimeout: 30000,
  maxRetries: 3,
  compression: true,
});
export class ElasticsearchService {
  /**
   * Create or update the property index with mappings
   */
  async createIndex(forceCreate = false): Promise<boolean> {
    try {
      // Check if index exists
      const indexExists = await client.indices.exists({ index: INDEX });

      if (indexExists && !forceCreate) {
        console.log(`Index ${INDEX} already exists.`);
        return true;
      }

      // If forceCreate is true and index exists, delete it first
      if (indexExists && forceCreate) {
        await client.indices.delete({ index: INDEX });
        console.log(`Deleted existing index ${INDEX}.`);
      }

      // Create index with mappings
      await client.indices.create({
        index: INDEX,
        mappings: propertyMappings as any,
        settings: propertySettings as any,
      });

      console.log(`Created index ${INDEX} successfully.`);
      return true;
    } catch (error) {
      console.error(`Error creating index ${INDEX}:`, error);
      throw error;
    }
  }
  /**
   * Search for properties with the given query parameters
   */
  async searchProperties(query: PropertySearchQuery): Promise<{
    results: Property[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    aggregations?: PropertySearchAggregations;
  }> {
    try {
      // Build Elasticsearch query
      const esQuery = this.buildPropertySearchQuery(query);

      // Calculate from based on pagination
      const from = (query.page - 1) * query.pageSize;

      // Execute search request with proper options
      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          from,
          size: query.pageSize,
          query: esQuery,
          sort: this.buildSortQuery(query),
          aggs: this.buildAggregations(),
        },
        {
          // Request specific options
          requestTimeout: 30000, // 30 second timeout
          maxRetries: 3, // Retry up to 3 times
          ignore: [404], // Don't throw on 404
        }
      );

      // Map results to Property type
      const results = response.hits.hits.map((hit) => {
        const source = hit._source as ElasticsearchSource;
        return {
          id: typeof source.id === 'string' ? parseInt(source.id) : source.id,
          title: source.title,
          price: source.price || 0,
          bedrooms: source.bedrooms,
          bathrooms: source.bathrooms,
          area: source.area,
          description: source.description,
          amenities: source.amenities,
          location: source.location,
          year_built: source.year_built,
          property_type: source.property_type, // Add this line
          images: source.image_urls ?? [],
          district: source.district,
          city: source.city,
          address: source.address,
          has_elevator: source.has_elevator,
          has_parking: source.has_parking,
          has_storage: source.has_storage,
          has_balcony: source.has_balcony,
          investment_score: source.investment_score,
        };
      });

      // Calculate total pages
      const total = response.hits.total;
      const totalCount = typeof total === 'number' ? total : total?.value || 0;
      const totalPages = Math.ceil(totalCount / query.pageSize);

      return {
        results,
        total: totalCount,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
        // FIX: Cast to unknown first for aggregations
        aggregations:
          response.aggregations as unknown as PropertySearchAggregations,
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      // Properly handle known Elasticsearch errors
      if (error instanceof errors.ConnectionError) {
        throw new Error(
          'Could not connect to Elasticsearch. Please try again later.'
        );
      } else if (error instanceof errors.TimeoutError) {
        throw new Error(
          'The search request timed out. Please try a more specific search.'
        );
      } else if (error instanceof errors.ResponseError) {
        // Handle response errors (4xx, 5xx)
        const statusCode = (error as errors.ResponseError).statusCode || 500;
        if (statusCode === 400) {
          throw new Error(
            'Invalid search query. Please check your search parameters.'
          );
        } else {
          throw new Error('An error occurred while searching properties.');
        }
      }
      throw error;
    }
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(id: number): Promise<Property | null> {
    try {
      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          query: {
            term: { id: id },
          },
          size: 1,
        }
      );

      if (response.hits.hits.length === 0) {
        return null;
      }

      const source = response.hits.hits[0]._source as ElasticsearchSource;
      return {
        id: typeof source.id === 'string' ? parseInt(source.id) : source.id,
        title: source.title,
        price: source.price || 0,
        bedrooms: source.bedrooms,
        bathrooms: source.bathrooms,
        area: source.area,
        description: source.description,
        location: source.location,
        year_built: source.year_built,
        type: source.property_type,
        images: source.image_urls ?? [],

        // …and any others you need
        // address: src.address,
        // city: src.city,
        // district: src.district,
        // has_elevator: src.has_elevator,
        // has_parking: src.has_parking,
        // has_storage: src.has_storage,
        // has_balcony: src.has_balcony,
        // investment_score: src.investment_score,
        // created_at: src.created_at,
        // updated_at: src.updated_at,
      };
    } catch (error) {
      console.error(`Error fetching property with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on a query string
   */
  async getSuggestions(
    params: SearchSuggestionsQuery
  ): Promise<SearchSuggestion[]> {
    if (!params.q || params.q.length < 2) {
      return [];
    }

    try {
      const query = params.q.trim();
      const suggestions: SearchSuggestion[] = [];

      // Create an AbortController for timeouts
      const abortController = new AbortController();
      // Set a timeout for suggestion requests
      const timeoutId = setTimeout(() => abortController.abort(), 5000);

      try {
        // Get property title suggestions
        const titleSuggestions = await this.getPropertyTitleSuggestions(
          query,
          params.limit,
          abortController.signal
        );
        suggestions.push(...titleSuggestions);

        // Get filter suggestions if we have enough characters
        if (query.length >= 2) {
          // Run suggestion requests in parallel for better performance
          const [bedroomSuggestions, priceSuggestions, areaSuggestions] =
            await Promise.all([
              // Add bedroom filters
              this.getBedroomSuggestions(
                query,
                Math.min(3, params.limit),
                abortController.signal
              ),
              // Add price range filters
              this.getPriceSuggestions(
                query,
                Math.min(2, params.limit),
                abortController.signal
              ),
              // Add area filters
              this.getAreaSuggestions(
                query,
                Math.min(2, params.limit),
                abortController.signal
              ),
            ]);

          suggestions.push(
            ...bedroomSuggestions,
            ...priceSuggestions,
            ...areaSuggestions
          );
        }

        // Create combination suggestions if we have a location-like query
        if (this.looksLikeLocationQuery(query) && query.length > 3) {
          const combinationSuggestions = await this.getCombinationSuggestions(
            query,
            Math.min(3, params.limit),
            abortController.signal
          );
          suggestions.push(...combinationSuggestions);
        }
      } finally {
        // Clear the timeout
        clearTimeout(timeoutId);
      }

      // Limit total suggestions and return
      return suggestions.slice(0, MAX_SUGGESTIONS);
    } catch (error) {
      // Proper error handling based on error type
      if (error instanceof errors.RequestAbortedError) {
        console.warn('Suggestion request aborted:', (error as Error).message);
        return []; // Return empty array instead of failing
      } else if (error instanceof errors.ConnectionError) {
        console.error('Connection error while getting suggestions:', error);
        return []; // Return empty array instead of failing
      } else if (error instanceof errors.ResponseError) {
        console.error(
          'Elasticsearch error while getting suggestions:',
          (error as Error).message
        );
        return []; // Return empty array instead of failing
      }

      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  // In elasticsearch.service.ts, ensure buildPropertySearchQuery handles property_type:

  private buildPropertySearchQuery(
    query: PropertySearchQuery
  ): QueryDslQueryContainer {
    const mustClauses: QueryDslQueryContainer[] = [];
    const filterClauses: QueryDslQueryContainer[] = [];

    // Add text search if query string is provided
    if (query.q && query.q.length > 0) {
      mustClauses.push({
        multi_match: {
          query: query.q,
          fields: ['title^3', 'description', 'amenities'],
          fuzziness: 'AUTO',
          prefix_length: 1,
        },
      });
    }

    // Add property type filter - ensure it's properly handled
    if ('property_type' in query && query.property_type) {
      filterClauses.push({
        term: {
          'property_type.keyword': query.property_type, // Use .keyword for exact match
        },
      });
    }

    // Add bedrooms filter
    if (query.minBedrooms !== undefined || query.maxBedrooms !== undefined) {
      const rangeQuery: { gte?: number; lte?: number } = {};
      if (query.minBedrooms !== undefined) rangeQuery.gte = query.minBedrooms;
      if (query.maxBedrooms !== undefined) rangeQuery.lte = query.maxBedrooms;
      filterClauses.push({ range: { bedrooms: rangeQuery } });
    }

    // Add price range filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const rangeQuery: { gte?: number; lte?: number } = {};
      if (query.minPrice !== undefined) rangeQuery.gte = query.minPrice;
      if (query.maxPrice !== undefined) rangeQuery.lte = query.maxPrice;
      filterClauses.push({ range: { price: rangeQuery } });
    }

    // Build the final query
    if (mustClauses.length === 0) {
      mustClauses.push({ match_all: {} });
    }

    return {
      bool: {
        must: mustClauses,
        ...(filterClauses.length > 0 && { filter: filterClauses }),
      },
    };
  }

  /**
   * Build sort query based on the search parameters
   */
  private buildSortQuery(query: PropertySearchQuery): SortCombinations[] {
    const sortArray: SortCombinations[] = [];

    switch (query.sortBy) {
      case 'price':
        sortArray.push({ price: { order: query.sortOrder } });
        break;
      case 'date':
        sortArray.push({ year_built: { order: query.sortOrder } });
        break;
      case 'relevance':
      default:
        if (query.q) {
          sortArray.push({ _score: { order: 'desc' } });
        }
        // **no more** `id` sort
        return sortArray;
    }

    return sortArray;
  }

  /**
   * Build aggregations for search results
   */
  private buildAggregations(): buildAggsReturn {
    return {
      // Price range buckets
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 500_000_000, key: 'less_than_500m' },
            { from: 500_000_000, to: 1_000_000_000, key: '500m_to_1b' },
            { from: 1_000_000_000, to: 2_000_000_000, key: '1b_to_2b' },
            { from: 2_000_000_000, to: 5_000_000_000, key: '2b_to_5b' },
            { from: 5_000_000_000, key: 'more_than_5b' },
          ],
        },
      },

      // Bedroom counts
      bedrooms: {
        terms: {
          field: 'bedrooms',
          size: 10,
          missing: '0', // Consider if '0' is appropriate or if it should be a number if field is numeric
          order: { _key: 'asc' },
        },
      },

      // Bathroom counts
      bathrooms: {
        terms: {
          field: 'bathrooms', // Assuming bathrooms is a string or keyword field if using string terms
          size: 10,
          missing: '0',
          order: { _key: 'asc' },
        },
      },

      // Area range buckets
      area_ranges: {
        range: {
          field: 'area',
          ranges: [
            { to: 50, key: 'less_than_50' },
            { from: 50, to: 100, key: '50_to_100' },
            { from: 100, to: 150, key: '100_to_150' },
            { from: 150, to: 200, key: '150_to_200' },
            { from: 200, key: 'more_than_200' },
          ],
        },
      },

      // Average metrics
      average_price: { avg: { field: 'price' } },
      average_area: { avg: { field: 'area' } },

      // Year built histogram
      year_built_histogram: {
        histogram: {
          field: 'year_built',
          interval: 5, // Group by 5-year intervals
          min_doc_count: 1,
        },
      },
    } as buildAggsReturn;
  }

  /**
   * Get property title suggestions based on query string
   */
  private async getPropertyTitleSuggestions(
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<SearchSuggestion[]> {
    try {
      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          size: limit,
          query: {
            multi_match: {
              query,
              fields: ['title^3', 'description'],
              fuzziness: 'AUTO',
              prefix_length: 1,
            },
          },
          _source: ['id', 'title', 'price', 'bedrooms', 'area'],
        },
        {
          signal, // Pass the abort signal
          requestTimeout: 3000, // Shorter timeout for suggestions
          maxRetries: 1, // Fewer retries for suggestions
        }
      );

      return response.hits.hits.map((hit) => {
        const source = hit._source as ElasticsearchSource;
        return {
          type: 'property',
          text: source.title,
          query: source.title, // Consider if this should be different, e.g. just the ID
          count: 1, // This count is arbitrary, might want actual doc count if meaningful
        };
      });
    } catch (error) {
      // Don't log aborted requests as errors
      if (error instanceof errors.RequestAbortedError) {
        return [];
      }
      console.error('Error getting title suggestions:', error);
      return [];
    }
  }

  /**
   * Get bedroom filter suggestions
   */
  private async getBedroomSuggestions(
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // First check if we have properties with bedrooms
      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          size: 0, // We only care about aggregations
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['title^3', 'description'],
                    fuzziness: 'AUTO',
                  },
                },
              ],
              filter: [
                {
                  exists: {
                    field: 'bedrooms',
                  },
                },
              ],
            },
          },
          aggs: {
            bedrooms: {
              terms: {
                field: 'bedrooms',
                size: 5, // Get top 5 bedroom counts
              },
            },
          },
        },
        {
          signal, // Pass the abort signal
          requestTimeout: 3000, // Shorter timeout for suggestions
          maxRetries: 1, // Fewer retries for suggestions
        }
      );

      // Get bedroom buckets
      if (!response.aggregations) {
        return suggestions;
      }
      // FIX: Cast to unknown first
      const aggregations = response.aggregations as unknown as FullAggregations;

      // Ensure buckets are treated as an array. The type AggregationsLongTermsBucketKeys might be too generic.
      // The actual bucket type is often AggregationsLongTermsBucket[] or similar.
      const bucketsArray = aggregations.bedrooms?.buckets;

      if (Array.isArray(bucketsArray)) {
        // Add suggestions for common bedroom counts
        for (let i = 1; i <= 3 && suggestions.length < limit; i++) {
          const bucket = bucketsArray.find(
            (b) => b.key === i || String(b.key) === String(i)
          ); // Handle potential string/number mismatch for key

          if (bucket && bucket.doc_count > 0) {
            suggestions.push({
              type: 'filter',
              text: `${query} با حداقل ${i} خوابه`,
              query: `${query} با حداقل ${i} خوابه`, // This query text might need adjustment for actual search
              count: bucket.doc_count,
              filter: {
                field: 'minBedrooms',
                value:
                  typeof bucket.key === 'string'
                    ? parseInt(bucket.key, 10)
                    : bucket.key,
              },
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      if (error instanceof errors.RequestAbortedError) {
        return [];
      }
      console.error('Error getting bedroom suggestions:', error);
      return [];
    }
  }

  /**
   * Get price filter suggestions
   */
  private async getPriceSuggestions(
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          size: 0,
          query: {
            multi_match: {
              query,
              fields: ['title^3', 'description'],
              fuzziness: 'AUTO',
            },
          },
          aggs: {
            price_stats: {
              // Not directly used in current logic but could be
              stats: {
                field: 'price',
              },
            },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  // Define ranges that make sense for suggestions
                  { to: 500000000, key: 'under_500m' },
                  { from: 500000000, to: 1000000000, key: '500m_to_1b' },
                  { from: 1000000000, to: 3000000000, key: '1b_to_3b' },
                  { from: 3000000000, key: 'over_3b' },
                ],
              },
            },
          },
        },
        {
          signal,
          requestTimeout: 3000,
          maxRetries: 1,
        }
      );

      // FIX: Cast to unknown first
      const aggregations =
        response.aggregations as unknown as PropertySearchAggregations;
      const priceRangesAgg = aggregations?.price_ranges;

      if (priceRangesAgg && Array.isArray(priceRangesAgg.buckets)) {
        const under500MBucket = priceRangesAgg.buckets.find(
          (b) => b.key === 'under_500m'
        );
        if (
          under500MBucket &&
          under500MBucket.doc_count > 0 &&
          suggestions.length < limit
        ) {
          suggestions.push({
            type: 'filter',
            text: `${query} با قیمت زیر ۵۰۰ میلیون`,
            query: `${query} با قیمت زیر ۵۰۰ میلیون`,
            count: under500MBucket.doc_count,
            filter: { field: 'maxPrice', value: 500000000 },
          });
        }

        // Find a bucket that represents "under 1B"
        // This logic depends on how your ranges are defined.
        // For example, if '500m_to_1b' and 'under_500m' exist, you might combine them
        // or target a specific range.
        const upTo1BBucket = priceRangesAgg.buckets.find(
          (b) => b.key === '500m_to_1b' || b.key === 'under_500m'
        );
        // A more precise way if you have a range ending at 1B:
        // const under1BBucket = priceRangesAgg.buckets.find(b => b.to === 1000000000);

        // Example for "under 1B" if you have a range { to: 1000000000, key: 'under_1b' }
        const under1BBucketFromKey = priceRangesAgg.buckets.find(
          (b) => b.key === 'under_1b'
        ); // Assuming you add such a key
        const under1BBucketDirect = priceRangesAgg.buckets.find(
          (b) => b.to === 1000000000 && !b.from
        ); // A range like { to: 1B }

        const targetBucketForUnder1B =
          under1BBucketDirect || under1BBucketFromKey; // Prioritize direct if exists

        if (
          targetBucketForUnder1B &&
          targetBucketForUnder1B.doc_count > 0 &&
          suggestions.length < limit
        ) {
          suggestions.push({
            type: 'filter',
            text: `${query} با قیمت زیر ۱ میلیارد`,
            query: `${query} با قیمت زیر ۱ میلیارد`,
            count: targetBucketForUnder1B.doc_count,
            filter: { field: 'maxPrice', value: 1000000000 },
          });
        }
      }

      return suggestions;
    } catch (error) {
      if (error instanceof errors.RequestAbortedError) {
        return [];
      }
      console.error('Error getting price suggestions:', error);
      return [];
    }
  }

  /**
   * Get area filter suggestions
   */
  private async getAreaSuggestions(
    query: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      const response: SearchResponse<ElasticsearchSource> = await client.search(
        {
          index: INDEX,
          size: 0,
          query: {
            multi_match: {
              query,
              fields: ['title^3', 'description'],
              fuzziness: 'AUTO',
            },
          },
          aggs: {
            area_stats: {
              // Not directly used but good for context
              stats: {
                field: 'area',
              },
            },
            area_ranges: {
              range: {
                field: 'area',
                ranges: [
                  // Define ranges for suggestions
                  { from: 50, to: 100, key: '50_to_100' },
                  { from: 100, to: 150, key: '100_to_150' },
                  { from: 150, key: 'over_150' }, // Adjusted to 'over_150' for clarity
                ],
              },
            },
          },
        },
        {
          signal,
          requestTimeout: 3000,
          maxRetries: 1,
        }
      );

      // FIX: Cast to unknown first
      const aggregations =
        response.aggregations as unknown as PropertySearchAggregations;
      const areaRangesAgg = aggregations?.area_ranges;

      if (areaRangesAgg && Array.isArray(areaRangesAgg.buckets)) {
        // Find properties with area more than 100 sq meters.
        // This could be a sum of '100_to_150' and 'over_150' or a specific range.
        // For simplicity, let's find '100_to_150' for "around 100-150" or 'over_150' for "more than 150"
        const bucket100to150 = areaRangesAgg.buckets.find(
          (b) => b.key === '100_to_150'
        );
        if (
          bucket100to150 &&
          bucket100to150.doc_count > 0 &&
          suggestions.length < limit
        ) {
          suggestions.push({
            type: 'filter',
            text: `${query} با متراژ ۱۰۰ تا ۱۵۰ متر`,
            query: `${query} با متراژ ۱۰۰ تا ۱۵۰ متر`,
            count: bucket100to150.doc_count,
            filter: { field: 'minArea', value: 100 }, // Could also be more complex range filter
          });
        }

        const bucketOver150 = areaRangesAgg.buckets.find(
          (b) => b.key === 'over_150'
        );
        if (
          bucketOver150 &&
          bucketOver150.doc_count > 0 &&
          suggestions.length < limit
        ) {
          suggestions.push({
            type: 'filter',
            text: `${query} با متراژ بالای ۱۵۰ متر`,
            query: `${query} با متراژ بالای ۱۵۰ متر`,
            count: bucketOver150.doc_count,
            filter: { field: 'minArea', value: 150 },
          });
        }
      }

      return suggestions;
    } catch (error) {
      if (error instanceof errors.RequestAbortedError) {
        return [];
      }
      console.error('Error getting area suggestions:', error);
      return [];
    }
  }

  /**
   * Get combination suggestions (e.g., location + bedrooms + price)
   */
  private async getCombinationSuggestions(
    query: string,
    limit: number,
    signal?: AbortSignal // signal not used in client.count by default, keep for consistency
  ): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      const twoBedroomResponse: CountResponse = await client.count(
        {
          index: INDEX,
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['title^3', 'description'],
                    fuzziness: 'AUTO',
                  },
                },
              ],
              filter: [
                {
                  range: {
                    bedrooms: {
                      gte: 2,
                    },
                  },
                },
              ],
            },
          },
        } /* Pass options like signal here if supported by client.count and needed */
      );

      if (twoBedroomResponse.count > 0 && suggestions.length < limit) {
        suggestions.push({
          type: 'combination',
          text: `${query} با حداقل ۲ خوابه`,
          query: `${query} با حداقل ۲ خوابه`,
          count: twoBedroomResponse.count,
          filter: {
            field: 'minBedrooms',
            value: 2,
          },
        });
      }

      const under1BResponse: CountResponse = await client.count({
        index: INDEX,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'description'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [
              {
                range: {
                  price: {
                    lte: 1000000000,
                  },
                },
              },
            ],
          },
        },
      });

      if (under1BResponse.count > 0 && suggestions.length < limit) {
        suggestions.push({
          type: 'combination',
          text: `${query} با قیمت زیر ۱ میلیارد`,
          query: `${query} با قیمت زیر ۱ میلیارد`,
          count: under1BResponse.count,
          filter: {
            field: 'maxPrice',
            value: 1000000000,
          },
        });
      }

      return suggestions;
    } catch (error) {
      if (error instanceof errors.RequestAbortedError) {
        // Check if client.count supports AbortSignal
        return [];
      }
      console.error('Error getting combination suggestions:', error);
      return [];
    }
  }

  /**
   * Determine if a query looks like it might be a location query
   */
  private looksLikeLocationQuery(query: string): boolean {
    const filterKeywords = [
      'خوابه',
      'اتاق',
      'متر',
      'قیمت',
      'تومان',
      'میلیون',
      'میلیارد',
    ];
    return (
      query.length >= 3 &&
      !filterKeywords.some((keyword) => query.includes(keyword))
    );
  }

  /**
   * Get property type suggestions for the first stage of search
   */
  async getPropertyTypeSuggestions(
    prefix: string,
    location?: string
  ): Promise<SearchSuggestion[]> {
    try {
      const contexts: Record<string, string[]> = {}; // Proper typing instead of any
      if (location) {
        contexts['location'] = [location];
      }
      contexts['stage'] = ['property_type'];

      const response = await client.search({
        index: INDEX,
        suggest: {
          property_type_suggest: {
            prefix,
            completion: {
              field: 'property_type.suggest',
              size: 5,
              contexts,
            },
          },
        },
      });

      // Get the suggest results and ensure it's an array
      const suggestResults =
        response.suggest?.['property_type_suggest']?.[0]?.options;
      const suggestions = Array.isArray(suggestResults) ? suggestResults : [];

      // Now TypeScript knows suggestions is definitely an array
      return suggestions.map(
        (option: SearchCompletionSuggestOption<unknown>) => ({
          type: 'property_type',
          text: option.text,
          query: option.text,
          count: option._score || 1,
        })
      );
    } catch (error) {
      console.error('Error getting property type suggestions:', error);
      return [];
    }
  }

  /**
   * Get bedroom suggestions for the second stage of search
   */
  async getStageBedroomSuggestions(
    propertyType: string,
    prefix = ''
  ): Promise<SearchSuggestion[]> {
    try {
      const response = await client.search({
        index: INDEX,
        suggest: {
          bedroom_suggest: {
            prefix,
            completion: {
              field: 'bedrooms.suggest',
              size: 5,
              contexts: {
                property_type: [propertyType],
              },
            },
          },
        },
      });

      // Safely extract suggest results and ensure it's an array
      const suggestResults =
        response.suggest?.['bedroom_suggest']?.[0]?.options;
      const suggestions = Array.isArray(suggestResults) ? suggestResults : [];

      // Now TypeScript knows suggestions is definitely an array
      return suggestions.map(
        (option: SearchCompletionSuggestOption<unknown>) => ({
          type: 'bedrooms',
          text: `${option.text}خوابه`,
          query: `${option.text}خوابه`,
          count: option._score || 1,
          filter: {
            field: 'bedrooms',
            value: parseInt(option.text),
          },
        })
      );
    } catch (error) {
      console.error('Error getting bedroom suggestions:', error);
      return [];
    }
  }

  /**
   * Get price range suggestions for the third stage based on aggregations
   */
  async getStagePriceSuggestions(
    propertyType: string,
    bedrooms?: number
  ): Promise<SearchSuggestion[]> {
    try {
      // Build filter for properties matching current criteria
      const must: QueryDslQueryContainer[] = [
        { term: { property_type: propertyType } },
      ];
      if (bedrooms !== undefined) {
        must.push({ term: { bedrooms: bedrooms } });
      }

      // Get price statistics for matching properties
      const response = await client.search({
        index: INDEX,
        size: 0,
        query: {
          bool: { must },
        },
        aggs: {
          price_stats: {
            stats: { field: 'price' },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 5000000000, key: 'تا ۵ میلیارد' },
                {
                  from: 5000000000,
                  to: 10000000000,
                  key: 'بین ۵ تا ۱۰ میلیارد',
                },
                {
                  from: 10000000000,
                  to: 20000000000,
                  key: 'بین ۱۰ تا ۲۰ میلیارد',
                },
                { from: 20000000000, key: 'بالای ۲۰ میلیارد' },
              ],
            },
          },
        },
      });

      const suggestions: SearchSuggestion[] = [];

      // Type cast the aggregation to our custom type
      if (response.aggregations) {
        // Use type assertion to handle the price_ranges aggregation
        const priceRanges = response.aggregations[
          'price_ranges'
        ] as unknown as RangeAggregation;

        if (priceRanges && Array.isArray(priceRanges.buckets)) {
          for (const bucket of priceRanges.buckets) {
            if (bucket.doc_count > 0) {
              // Create suggestion with properly typed filter object
              suggestions.push({
                type: 'price_range',
                text: bucket.key,
                query: bucket.key,
                count: bucket.doc_count,
                filter: {
                  field: 'price',
                  // Use optional chaining with these properties
                  ...(bucket.from !== undefined && { min: bucket.from }),
                  ...(bucket.to !== undefined && { max: bucket.to }),
                  value: '',
                },
              });
            }
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting price suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const elasticsearchService = new ElasticsearchService();
