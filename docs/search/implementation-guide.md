# Advanced Search Implementation Guide - Complete Suggester System

## Quick Implementation Checklist

### Phase 1: Advanced Elasticsearch Setup

- [ ] Create index with completion suggester mappings
- [ ] Configure Persian analyzer with ICU
- [ ] Set up search-as-you-type fields
- [ ] Index suggestion documents

### Phase 2: Completion Suggester Implementation

- [ ] Property type completion endpoint
- [ ] Context-aware bedroom suggestions
- [ ] Dynamic price suggestions
- [ ] Aggregation-based suggestions

### Phase 3: Search-as-You-Type Integration

- [ ] Multi-field bool prefix queries
- [ ] Persian text search optimization
- [ ] Hybrid suggestion system

### Phase 4: Testing & Integration

- [ ] Comprehensive Vitest test suite
- [ ] Performance optimization
- [ ] Error handling

## 1. Advanced tRPC Router with Suggesters

### Complete Search Router with Suggestions

```typescript
// search.router.ts
export const searchRouter = router({
  // Property Type Suggestions
  getPropertyTypeSuggestions: publicProcedure
    .input(
      z.object({
        prefix: z.string(),
        location: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await suggestionService.getPropertyTypeSuggestions(input.prefix, { location: [input.location] });
    }),

  // Bedroom Suggestions (Context-Aware)
  getBedroomSuggestions: publicProcedure
    .input(
      z.object({
        propertyType: z.string(),
        prefix: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await suggestionService.getBedroomSuggestions(input.propertyType, input.prefix);
    }),

  // Dynamic Price Suggestions
  getPriceSuggestions: publicProcedure
    .input(
      z.object({
        propertyType: z.string(),
        bedrooms: z.number().optional(),
        location: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await suggestionService.getPriceSuggestions(input);
    }),

  // Search-as-You-Type
  searchAsYouType: publicProcedure
    .input(
      z.object({
        query: z.string(),
        location: z.string(),
        propertyType: z.string().optional(),
        bedrooms: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await searchService.searchAsYouType(input);
    }),

  // Combined Search with Suggestions
  searchWithSuggestions: publicProcedure.input(searchInputSchema).query(async ({ input }) => {
    const [searchResults, suggestions] = await Promise.all([searchService.searchProperties(input), suggestionService.getNextStageSuggestions(input)]);

    return {
      results: searchResults,
      suggestions: suggestions,
    };
  }),
});
```

## 2. Suggestion Service Implementation

### Complete Suggestion Service

```typescript
// suggestion.service.ts
export class SuggestionService {
  private client: Client;

  async getPropertyTypeSuggestions(prefix: string, context: any) {
    const query = {
      suggest: {
        property_type_suggest: {
          prefix,
          completion: {
            field: 'property_type.suggest',
            size: 10,
            contexts: context,
          },
        },
      },
    };

    const result = await this.client.search({
      index: 'deenji-properties',
      body: query,
    });

    return this.formatCompletionSuggestions(result.suggest.property_type_suggest);
  }

  async getBedroomSuggestions(propertyType: string, prefix?: string) {
    const query = {
      suggest: {
        bedroom_suggest: {
          prefix: prefix || '',
          completion: {
            field: 'bedrooms.suggest',
            size: 5,
            contexts: {
              property_type: [propertyType],
            },
          },
        },
      },
    };

    const result = await this.client.search({
      index: 'deenji-properties',
      body: query,
    });

    return this.formatCompletionSuggestions(result.suggest.bedroom_suggest);
  }

  async getPriceSuggestions(params: { propertyType: string; bedrooms?: number; location: string }) {
    // Get dynamic price suggestions based on current filters
    const mustClauses = [{ term: { location: params.location } }, { term: { property_type: params.propertyType } }, { term: { status: 'active' } }];

    if (params.bedrooms) {
      mustClauses.push({ term: { bedrooms: params.bedrooms } });
    }

    const query = {
      query: { bool: { must: mustClauses } },
      size: 0,
      aggs: {
        price_stats: {
          stats: { field: 'price' },
        },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { key: 'budget', to: 5000000000 },
              { key: 'mid', from: 5000000000, to: 15000000000 },
              { key: 'luxury', from: 15000000000 },
            ],
          },
        },
        price_histogram: {
          histogram: {
            field: 'price',
            interval: 2000000000,
            min_doc_count: 1,
          },
        },
      },
    };

    const result = await this.client.search({
      index: 'deenji-properties',
      body: query,
    });

    return this.generateDynamicPriceSuggestions(result.aggregations);
  }

  private generateDynamicPriceSuggestions(aggs: any) {
    const stats = aggs.price_stats;
    const ranges = aggs.price_ranges.buckets;

    const suggestions = [];

    // Add range-based suggestions
    ranges.forEach((range) => {
      if (range.doc_count > 0) {
        suggestions.push({
          text: this.formatPriceRange(range.key, range.from, range.to),
          count: range.doc_count,
          type: 'range',
        });
      }
    });

    // Add statistical suggestions
    if (stats.count > 0) {
      suggestions.push({
        text: `تا ${this.formatPrice(stats.max)}`,
        type: 'max',
        value: stats.max,
      });

      suggestions.push({
        text: `حداقل ${this.formatPrice(stats.min)}`,
        type: 'min',
        value: stats.min,
      });

      const avgLow = Math.round(stats.avg * 0.8);
      const avgHigh = Math.round(stats.avg * 1.2);
      suggestions.push({
        text: `بین ${this.formatPrice(avgLow)} تا ${this.formatPrice(avgHigh)}`,
        type: 'around_avg',
        min: avgLow,
        max: avgHigh,
      });
    }

    return suggestions;
  }

  async getNextStageSuggestions(searchParams: any) {
    const suggestions = {};

    // If no property type selected, suggest property types
    if (!searchParams.propertyType) {
      suggestions.propertyTypes = await this.getPropertyTypeSuggestions('', { location: [searchParams.location] });
    }
    // If property type selected but no bedrooms, suggest bedrooms
    else if (!searchParams.bedrooms) {
      suggestions.bedrooms = await this.getBedroomSuggestions(searchParams.propertyType);
    }
    // If both selected, suggest price ranges
    else if (!searchParams.priceFilter) {
      suggestions.prices = await this.getPriceSuggestions({
        propertyType: searchParams.propertyType,
        bedrooms: searchParams.bedrooms,
        location: searchParams.location,
      });
    }

    return suggestions;
  }

  private formatPrice(price: number): string {
    if (price >= 1000000000) {
      return `${price / 1000000000} میلیارد`;
    } else if (price >= 1000000) {
      return `${price / 1000000} میلیون`;
    }
    return price.toString();
  }

  private formatPriceRange(key: string, from?: number, to?: number): string {
    const labels = {
      budget: 'تا ۵ میلیارد',
      mid: '۵ تا ۱۵ میلیارد',
      luxury: 'بالای ۱۵ میلیارد',
    };
    return labels[key] || `${this.formatPrice(from)} تا ${this.formatPrice(to)}`;
  }

  private formatCompletionSuggestions(suggestions: any[]): any[] {
    return (
      suggestions?.[0]?.options?.map((option) => ({
        text: option.text,
        score: option._score,
        contexts: option.contexts,
      })) || []
    );
  }
}
```

## 3. Search-as-You-Type Implementation

### Search Service with Search-as-You-Type

```typescript
// search.service.ts
export class SearchService {
  async searchAsYouType(params: { query: string; location: string; propertyType?: string; bedrooms?: number }) {
    const mustClauses = [{ term: { location: params.location } }, { term: { status: 'active' } }];

    if (params.propertyType) {
      mustClauses.push({ term: { property_type: params.propertyType } });
    }

    if (params.bedrooms) {
      mustClauses.push({ term: { bedrooms: params.bedrooms } });
    }

    const query = {
      query: {
        bool: {
          must: mustClauses,
          should: [
            {
              multi_match: {
                query: params.query,
                type: 'bool_prefix',
                fields: ['title.suggest', 'title.suggest._2gram', 'title.suggest._3gram', 'description.suggest', 'searchable_text', 'searchable_text._2gram', 'searchable_text._3gram'],
              },
            },
            {
              multi_match: {
                query: params.query,
                fields: ['title^2', 'description'],
                analyzer: 'persian_standard',
              },
            },
          ],
        },
      },
      suggest: {
        text_suggest: {
          text: params.query,
          term: {
            field: 'searchable_text',
          },
        },
      },
      highlight: {
        fields: {
          title: {},
          description: {},
        },
        pre_tags: [''],
        post_tags: [''],
      },
      size: 20,
    };

    const result = await this.client.search({
      index: 'deenji-properties',
      body: query,
    });

    return {
      hits: result.hits.hits,
      suggestions: result.suggest.text_suggest,
      total: result.hits.total.value,
    };
  }
}
```

## 4. Comprehensive Vitest Test Suite

### Advanced Search Tests with Suggesters

```typescript
// search.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('Advanced Search with Suggesters', () => {
  let client: any;

  beforeAll(async () => {
    // Setup test environment
    client = createTRPCClient({
      url: 'http://localhost:3000/api/trpc',
    });
  });

  describe('Completion Suggester Tests', () => {
    it('should provide property type suggestions', async () => {
      const result = await client.search.getPropertyTypeSuggestions.query({
        prefix: 'آپار',
        location: 'تهران',
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text).toContain('آپارتمان');
    });

    it('should provide context-aware bedroom suggestions', async () => {
      const result = await client.search.getBedroomSuggestions.query({
        propertyType: 'آپارتمان',
        prefix: '۲',
      });

      expect(result).toBeDefined();
      expect(result.some((s) => s.text.includes('۲خوابه'))).toBe(true);
    });

    it('should generate dynamic price suggestions', async () => {
      const result = await client.search.getPriceSuggestions.query({
        propertyType: 'آپارتمان',
        bedrooms: 3,
        location: 'تهران',
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.type === 'range')).toBe(true);
      expect(result.some((s) => s.text.includes('تا'))).toBe(true);
    });

    it('should provide next stage suggestions based on current state', async () => {
      const result = await client.search.searchWithSuggestions.query({
        location: 'تهران',
        propertyType: 'آپارتمان',
      });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.bedrooms).toBeDefined();
      expect(result.suggestions.bedrooms.length).toBeGreaterThan(0);
    });
  });

  describe('Search-as-You-Type Tests', () => {
    it('should handle partial Persian text input', async () => {
      const result = await client.search.searchAsYouType.query({
        query: 'آپارتمان سه',
        location: 'تهران',
      });

      expect(result.hits).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it('should provide relevant suggestions for incomplete queries', async () => {
      const result = await client.search.searchAsYouType.query({
        query: 'خواب',
        location: 'تهران',
        propertyType: 'آپارتمان',
      });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should highlight matched terms in results', async () => {
      const result = await client.search.searchAsYouType.query({
        query: 'آپارتمان',
        location: 'تهران',
      });

      expect(result.hits).toBeDefined();
      const firstHit = result.hits[0];
      expect(firstHit.highlight).toBeDefined();
      expect(firstHit.highlight.title?.[0] || firstHit.highlight.description?.[0]).toContain('');
    });
  });

  describe('Combined Search Scenarios', () => {
    it('should combine filters with search-as-you-type', async () => {
      const result = await client.search.searchAsYouType.query({
        query: 'لوکس',
        location: 'تهران',
        propertyType: 'آپارتمان',
        bedrooms: 3,
      });

      expect(result.hits).toBeDefined();
      expect(result.hits.every((hit) => hit._source.property_type === 'آپارتمان' && hit._source.bedrooms === 3)).toBe(true);
    });

    it('should handle empty queries with filters', async () => {
      const result = await client.search.searchAsYouType.query({
        query: '',
        location: 'تهران',
        propertyType: 'ویلا',
      });

      expect(result.hits).toBeDefined();
      expect(result.hits.every((hit) => hit._source.property_type === 'ویلا')).toBe(true);
    });

    it('should progressive build suggestions', async () => {
      // Stage 1: No filters
      const stage1 = await client.search.searchWithSuggestions.query({
        location: 'تهران',
      });
      expect(stage1.suggestions.propertyTypes).toBeDefined();

      // Stage 2: Property type selected
      const stage2 = await client.search.searchWithSuggestions.query({
        location: 'تهران',
        propertyType: 'آپارتمان',
      });
      expect(stage2.suggestions.bedrooms).toBeDefined();

      // Stage 3: Bedrooms selected
      const stage3 = await client.search.searchWithSuggestions.query({
        location: 'تهران',
        propertyType: 'آپارتمان',
        bedrooms: 3,
      });
      expect(stage3.suggestions.prices).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const start = Date.now();

      await client.search.searchAsYouType.query({
        query: 'آپارتمان',
        location: 'تهران',
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // 200ms limit
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          client.search.searchAsYouType.query({
            query: 'ویلا',
            location: 'تهران',
          })
        );

      const results = await Promise.all(requests);
      expect(results.every((r) => r.hits.length > 0)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid property type gracefully', async () => {
      const result = await client.search.getBedroomSuggestions.query({
        propertyType: 'نامعلوم',
        prefix: '۲',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty search queries', async () => {
      const result = await client.search.searchAsYouType.query({
        query: '',
        location: 'تهران',
      });

      expect(result.hits).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });
  });
});
```

## 5. Index Setup with Suggestion Documents

### Create Index with Completion Mappings

```bash
# Create the advanced index
curl -X PUT "localhost:9200/deenji-properties" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "property_type": {
        "type": "keyword",
        "fields": {
          "suggest": {
            "type": "completion",
            "contexts": [
              { "name": "location", "type": "category" },
              { "name": "stage", "type": "category" }
            ]
          }
        }
      },
      "bedrooms": {
        "type": "integer",
        "fields": {
          "suggest": {
            "type": "completion",
            "contexts": [
              { "name": "property_type", "type": "category" }
            ]
          }
        }
      },
      "searchable_text": {
        "type": "search_as_you_type",
        "analyzer": "persian_standard",
        "max_shingle_size": 4
      }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "persian_standard": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      }
    }
  }
}'
```

### Index Suggestion Documents

```bash
# Index property type suggestions
curl -X PUT "localhost:9200/deenji-properties/_doc/suggest_apt" -H "Content-Type: application/json" -d '{
  "property_type": "آپارتمان",
  "property_type.suggest": {
    "input": ["آپارتمان", "واحد آپارتمانی", "آپارتمان های تهران"],
    "contexts": {
      "location": ["تهران"],
      "stage": ["property_type"]
    }
  }
}'

# Index bedroom suggestions
curl -X PUT "localhost:9200/deenji-properties/_doc/suggest_2bed" -H "Content-Type: application/json" -d '{
  "bedrooms": 2,
  "bedrooms.suggest": {
    "input": ["۲خوابه", "دو خواب", "۲ خوابه"],
    "contexts": {
      "property_type": ["آپارتمان", "ویلا"]
    }
  }
}'
```

## 6. Performance Optimization

### Suggester Performance Tips

```typescript
// Cache frequent suggestions
const suggestionCache = new Map();

async function getCachedSuggestions(key: string, fetcher: () => Promise) {
  if (suggestionCache.has(key)) {
    return suggestionCache.get(key);
  }

  const result = await fetcher();
  suggestionCache.set(key, result);

  // Expire cache after 5 minutes
  setTimeout(() => suggestionCache.delete(key), 5 * 60 * 1000);

  return result;
}
```

### Query Optimization

```typescript
// Use filters for better performance
const optimizedQuery = {
  query: {
    bool: {
      filter: [
        // Filters are cached and faster
        { term: { location: 'تهران' } },
        { term: { status: 'active' } },
      ],
      must: [
        // Scoring queries only when needed
        { term: { property_type: 'آپارتمان' } },
      ],
    },
  },
};
```

This implementation provides a complete, production-ready search system with advanced Elasticsearch features including completion suggesters, search-as-you-type, and dynamic suggestions perfect for your multi-stage search flow.
