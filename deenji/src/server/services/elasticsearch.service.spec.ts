// src/server/services/elasticsearch.service.spec.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElasticsearchService } from './elasticsearch.service';

// Use vi.hoisted() to ensure mock functions are available during mock setup
const { mockSearch, mockIndex, mockCount, mockedErrors } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockIndex: vi.fn(),
  mockCount: vi.fn(),
  mockedErrors: {
    ConnectionError: class ConnectionError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ConnectionError';
      }
    },
    TimeoutError: class TimeoutError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
      }
    },
    ResponseError: class ResponseError extends Error {
      statusCode: number;
      constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'ResponseError';
        this.statusCode = statusCode;
      }
    },
    RequestAbortedError: class RequestAbortedError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'RequestAbortedError';
      }
    },
  },
}));

vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn(() => ({
    search: mockSearch,
    index: mockIndex,
    count: mockCount,
  })),
  errors: mockedErrors,
}));

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;
  let consoleSpy: any;

  beforeEach(() => {
    service = new ElasticsearchService();
    // Reset all mocks
    vi.clearAllMocks();

    // Set default mock responses to prevent undefined errors
    mockSearch.mockResolvedValue({
      hits: { hits: [], total: { value: 0 } },
      aggregations: {},
    });

    mockCount.mockResolvedValue({ count: 0 });

    // Spy on console.error and suppress output during tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore console.error
    consoleSpy.mockRestore();
  });

  describe('searchProperties', () => {
    it('should search properties with basic query', async () => {
      // Mock successful search response
      mockSearch.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                id: 1,
                title: 'آپارتمان در تهران',
                price: 1000000000,
                bedrooms: 2,
                bathrooms: 1,
                area: 80,
                description: 'آپارتمان زیبا',
                location: { city: 'تهران' },
              },
            },
          ],
          total: { value: 1 },
        },
        aggregations: {},
      });

      const result = await service.searchProperties({
        q: 'آپارتمان',
        page: 1,
        pageSize: 10,
        sortBy: 'relevance',
        sortOrder: 'asc',
      });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.results[0].title).toBe('آپارتمان در تهران');
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'divar_properties',
        }),
        expect.any(Object)
      );
    });

    it('should search properties with filters', async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [],
          total: { value: 0 },
        },
        aggregations: {},
      });

      await service.searchProperties({
        q: 'آپارتمان',
        minBedrooms: 2,
        maxPrice: 2000000000,
        page: 1,
        pageSize: 10,
        sortBy: 'relevance',
        sortOrder: 'asc',
      });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'divar_properties',
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { range: { bedrooms: { gte: 2 } } },
                { range: { price: { lte: 2000000000 } } },
              ]),
            }),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new mockedErrors.ConnectionError(
        'Connection failed'
      );
      mockSearch.mockRejectedValue(connectionError);

      await expect(
        service.searchProperties({
          q: 'test',
          page: 1,
          pageSize: 10,
          sortBy: 'relevance',
          sortOrder: 'asc',
        })
      ).rejects.toThrow(
        'Could not connect to Elasticsearch. Please try again later.'
      );
    });

    it('should handle timeout errors gracefully', async () => {
      const timeoutError = new mockedErrors.TimeoutError('Request timed out');
      mockSearch.mockRejectedValue(timeoutError);

      await expect(
        service.searchProperties({
          q: 'test',
          page: 1,
          pageSize: 10,
          sortBy: 'relevance',
          sortOrder: 'asc',
        })
      ).rejects.toThrow(
        'The search request timed out. Please try a more specific search.'
      );
    });

    it('should handle response errors with 400 status gracefully', async () => {
      const responseError = new mockedErrors.ResponseError('Bad request', 400);
      mockSearch.mockRejectedValue(responseError);

      await expect(
        service.searchProperties({
          q: 'test',
          page: 1,
          pageSize: 10,
          sortBy: 'relevance',
          sortOrder: 'asc',
        })
      ).rejects.toThrow(
        'Invalid search query. Please check your search parameters.'
      );
    });

    it('should handle response errors with 5xx status gracefully', async () => {
      const responseError = new mockedErrors.ResponseError('Server error', 503);
      mockSearch.mockRejectedValue(responseError);

      await expect(
        service.searchProperties({
          q: 'test',
          page: 1,
          pageSize: 10,
          sortBy: 'relevance',
          sortOrder: 'asc',
        })
      ).rejects.toThrow('An error occurred while searching properties.');
    });

    it('should handle generic errors gracefully', async () => {
      const genericError = new Error('Generic error');
      mockSearch.mockRejectedValue(genericError);

      await expect(
        service.searchProperties({
          q: 'test',
          page: 1,
          pageSize: 10,
          sortBy: 'relevance',
          sortOrder: 'asc',
        })
      ).rejects.toThrow('Generic error');
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions for short queries', async () => {
      const result = await service.getSuggestions({
        q: 't',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should get property title suggestions', async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                id: 1,
                title: 'آپارتمان در تهران',
                price: 1000000000,
              },
            },
          ],
        },
      });

      // Mock the count responses for combination suggestions
      mockCount.mockResolvedValue({ count: 5 });

      const result = await service.getSuggestions({
        q: 'آپارتمان',
        limit: 5,
      });

      expect(mockSearch).toHaveBeenCalled();
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'property',
            text: 'آپارتمان در تهران',
          }),
        ])
      );
    });

    it('should handle connection errors in suggestions gracefully', async () => {
      const connectionError = new mockedErrors.ConnectionError(
        'Connection failed'
      );
      mockSearch.mockRejectedValue(connectionError);
      // Also mock count to fail
      mockCount.mockRejectedValue(connectionError);

      const result = await service.getSuggestions({
        q: 'آپارتمان',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle request aborted errors in suggestions gracefully', async () => {
      const abortError = new mockedErrors.RequestAbortedError(
        'Request aborted'
      );
      mockSearch.mockRejectedValue(abortError);
      // Also mock count to fail
      mockCount.mockRejectedValue(abortError);

      const result = await service.getSuggestions({
        q: 'آپارتمان',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle suggestion aggregations properly', async () => {
      // Mock search for bedroom suggestions with proper aggregations
      mockSearch.mockResolvedValue({
        hits: { hits: [], total: { value: 0 } },
        aggregations: {
          bedrooms: {
            buckets: [
              { key: 1, doc_count: 10 },
              { key: 2, doc_count: 15 },
              { key: 3, doc_count: 8 },
            ],
          },
          price_ranges: {
            buckets: [
              { key: 'under_500m', doc_count: 25, to: 500000000 },
              {
                key: '500m_to_1b',
                doc_count: 30,
                from: 500000000,
                to: 1000000000,
              },
            ],
          },
          area_ranges: {
            buckets: [
              { key: '100_to_150', doc_count: 20, from: 100, to: 150 },
              { key: 'over_150', doc_count: 15, from: 150 },
            ],
          },
        },
      });

      // Mock count for combination suggestions
      mockCount.mockResolvedValue({ count: 12 });

      const result = await service.getSuggestions({
        q: 'تهران',
        limit: 10,
      });

      // Should have various types of suggestions
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.type === 'filter')).toBe(true);
    });
  });

  describe('getPropertyById', () => {
    it('should get property by ID', async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                id: 1,
                title: 'آپارتمان در تهران',
                price: 1000000000,
                bedrooms: 2,
                bathrooms: 1,
                area: 80,
                description: 'آپارتمان زیبا',
                location: { city: 'تهران' },
              },
            },
          ],
        },
      });

      const result = await service.getPropertyById(1);

      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          title: 'آپارتمان در تهران',
          price: 1000000000,
          bedrooms: 2,
          bathrooms: 1,
          area: 80,
          description: 'آپارتمان زیبا',
        })
      );
    });

    it('should return null for non-existent property', async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [],
        },
      });

      const result = await service.getPropertyById(999);

      expect(result).toBeNull();
    });

    it('should handle errors when getting property by ID', async () => {
      mockSearch.mockRejectedValue(new Error('Database error'));

      await expect(service.getPropertyById(1)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
