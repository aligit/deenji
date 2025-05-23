import { Client } from '@elastic/elasticsearch';
import type {
  IndicesCreateRequest,
  QueryDslQueryContainer,
  SearchRequest,
  SearchResponse,
  SearchHit,
  Sort,
  BulkRequest,
  BulkResponse,
  IndexRequest,
} from '@elastic/elasticsearch/lib/api/types'; // Path might be @elastic/elasticsearch/api/types in v9

export interface ParsedQuery {
  propertyType?: string;
  bedrooms?: { min?: number; max?: number };
  bathrooms?: { min?: number; max?: number };
  price?: { min?: number; max?: number; currency?: string };
  area?: { min?: number; max?: number };
  features?: string[];
  location?: string;
}

export interface PropertyData {
  id?: string;
  external_id: string;
  title: string;
  description?: string;
  price?: number;
  price_per_meter?: number;
  area?: number;
  bedrooms?: number;
  property_type?: string;
  has_parking?: boolean;
  has_storage?: boolean;
  has_balcony?: boolean;
  year_built?: number;
  attributes?: any[];
  image_urls?: string[];
  location?: {
    neighborhood?: string;
    city?: string;
    district?: string;
    coordinates?: { lat: number; lon: number };
  };
  created_at?: string | Date;
  updated_at?: string | Date;
  land_area?: number;
  floor_info?: string;
  building_direction?: string;
  renovation_status?: string;
  title_deed_type?: string;
  floor_material?: string;
  bathroom_type?: string;
  cooling_system?: string;
  heating_system?: string;
  hot_water_system?: string;
}

export interface SearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ElasticsearchService {
  private client: Client;

  constructor(config: { url: string; auth?: any }) {
    this.client = new Client({
      node: config.url,
      ...(config.auth && { auth: config.auth }),
    });
  }

  async createIndices(): Promise<void> {
    const propertiesIndexName = 'properties';
    const suggestionsIndexName = 'suggestions';

    const propertiesExists = await this.client.indices.exists({
      index: propertiesIndexName,
    });

    if (!propertiesExists) {
      const createPropertiesIndexRequest: IndicesCreateRequest = {
        index: propertiesIndexName,
        settings: {
          analysis: {
            analyzer: {
              persian: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'persian_normalizer'],
              },
            },
            filter: {
              persian_normalizer: {
                type: 'persian_normalization' as any,
              },
            },
          },
        },
        mappings: {
          properties: {
            external_id: { type: 'keyword' },
            title: {
              type: 'text',
              analyzer: 'persian',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' },
              },
            },
            description: {
              type: 'text',
              analyzer: 'persian',
              fields: {
                suggest: { type: 'search_as_you_type', max_shingle_size: 3 },
              },
            },
            price: { type: 'long' },
            price_per_meter: { type: 'long' },
            area: { type: 'double' },
            land_area: { type: 'double' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            year_built: { type: 'integer' },
            property_type: { type: 'keyword' },
            has_parking: { type: 'boolean' },
            has_storage: { type: 'boolean' },
            has_balcony: { type: 'boolean' },
            floor_info: { type: 'keyword' },
            building_direction: { type: 'keyword' },
            renovation_status: { type: 'keyword' },
            title_deed_type: { type: 'keyword' },
            floor_material: { type: 'keyword' },
            bathroom_type: { type: 'keyword' },
            cooling_system: { type: 'keyword' },
            heating_system: { type: 'keyword' },
            hot_water_system: { type: 'keyword' },
            attributes: { type: 'nested' },
            image_urls: { type: 'keyword' },
            location: {
              type: 'object',
              properties: {
                neighborhood: { type: 'keyword' },
                city: { type: 'keyword' },
                district: { type: 'keyword' },
                coordinates: { type: 'geo_point' },
              },
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      };
      await this.client.indices.create(createPropertiesIndexRequest);
    }

    const suggestionsExists = await this.client.indices.exists({
      index: suggestionsIndexName,
    });

    if (!suggestionsExists) {
      const createSuggestionsIndexRequest: IndicesCreateRequest = {
        index: suggestionsIndexName,
        mappings: {
          properties: {
            suggestion_text: {
              type: 'search_as_you_type',
              max_shingle_size: 3,
              analyzer: 'persian',
            },
            suggestion_type: { type: 'keyword' },
            context: { type: 'keyword' },
            priority: { type: 'integer' },
            property_types: { type: 'keyword' },
            features: { type: 'keyword' },
            created_at: { type: 'date' },
          },
        },
      };
      await this.client.indices.create(createSuggestionsIndexRequest);
    }
  }

  async indexProperty(property: PropertyData): Promise<void> {
    try {
      const { id, ...propertyWithoutInternalId } = property;
      const indexRequest: IndexRequest = {
        index: 'properties',
        id: property.external_id,
        document: {
          ...propertyWithoutInternalId,
          updated_at: new Date().toISOString(),
        },
      };
      await this.client.index(indexRequest);
    } catch (error) {
      console.error('Error indexing property:', error);
      throw error;
    }
  }

  async bulkIndexProperties(properties: PropertyData[]): Promise<void> {
    const operations = properties.flatMap((property) => {
      const { id, ...propertyWithoutInternalId } = property;
      return [
        { index: { _index: 'properties', _id: property.external_id } },
        { ...propertyWithoutInternalId, updated_at: new Date().toISOString() },
      ];
    });

    try {
      const bulkRequest: BulkRequest = { operations };
      const response: BulkResponse = await this.client.bulk(bulkRequest);

      if (response.errors) {
        const erroredItems = response.items.filter(
          (item) => item.index && item.index.error
        );
        console.error('Bulk indexing errors:', erroredItems);
      }
    } catch (error) {
      console.error('Bulk indexing error:', error);
      throw error;
    }
  }

  async searchWithNaturalLanguage(queryText: string, options?: SearchOptions) {
    const searchRequest: SearchRequest = {
      index: 'properties',
      from: ((options?.page || 1) - 1) * (options?.pageSize || 10),
      size: options?.pageSize || 10,
      query: {
        multi_match: {
          query: queryText,
          fields: [
            'title^2',
            'description',
            'location.neighborhood',
            'location.district',
          ],
        },
      },
    };

    try {
      const response: SearchResponse<PropertyData> =
        await this.client.search<PropertyData>(searchRequest);

      const results = response.hits.hits.map(
        (hit: SearchHit<PropertyData>) => ({
          id: hit._id,
          ...(hit._source || {}),
        })
      );

      // Safely access total hits
      let total = 0;
      if (typeof response.hits.total === 'number') {
        total = response.hits.total;
      } else if (
        response.hits.total &&
        typeof response.hits.total.value === 'number'
      ) {
        total = response.hits.total.value;
      }

      return {
        results,
        total,
        page: options?.page || 1,
        pageSize: options?.pageSize || 10,
        totalPages: Math.ceil(total / (options?.pageSize || 10)),
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw new Error('Failed to search properties');
    }
  }

  async getSuggestions(queryText: string): Promise<any[]> {
    try {
      const searchRequest: SearchRequest = {
        index: 'suggestions',
        query: {
          multi_match: {
            query: queryText,
            type: 'bool_prefix',
            fields: [
              'suggestion_text',
              'suggestion_text._2gram',
              'suggestion_text._3gram',
            ],
          },
        },
        sort: [{ priority: 'desc' }],
        size: 10,
      };
      const response: SearchResponse<any> = await this.client.search<any>(
        searchRequest
      );
      return response.hits.hits.map((hit: SearchHit<any>) => hit._source);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw new Error('Failed to get suggestions');
    }
  }

  async searchWithParsedQuery(parsed: ParsedQuery, options?: SearchOptions) {
    const esQuery = this.buildQueryFromParsed(parsed);

    const searchRequest: SearchRequest = {
      index: 'properties',
      from: ((options?.page || 1) - 1) * (options?.pageSize || 10),
      size: options?.pageSize || 10,
      query: esQuery, // buildQueryFromParsed already returns QueryDslQueryContainer
      sort: this.buildSort(options?.sortBy, options?.sortOrder),
    };

    try {
      const response: SearchResponse<PropertyData> =
        await this.client.search<PropertyData>(searchRequest);

      const results = response.hits.hits.map(
        (hit: SearchHit<PropertyData>) => ({
          id: hit._id,
          ...(hit._source || {}),
        })
      );

      let total = 0;
      if (typeof response.hits.total === 'number') {
        total = response.hits.total;
      } else if (
        response.hits.total &&
        typeof response.hits.total.value === 'number'
      ) {
        total = response.hits.total.value;
      }

      return {
        results,
        total,
        page: options?.page || 1,
        pageSize: options?.pageSize || 10,
        totalPages: Math.ceil(total / (options?.pageSize || 10)),
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw new Error('Failed to search properties');
    }
  }

  private buildQueryFromParsed(parsed: ParsedQuery): QueryDslQueryContainer {
    const mustClauses: QueryDslQueryContainer[] = [];
    const filterClauses: QueryDslQueryContainer[] = [];

    if (parsed.propertyType) {
      mustClauses.push({
        match: { property_type: parsed.propertyType },
      });
    }

    if (parsed.bedrooms) {
      const bedroomFilter: any = {};
      if (parsed.bedrooms.min !== undefined)
        bedroomFilter.gte = parsed.bedrooms.min;
      if (parsed.bedrooms.max !== undefined)
        bedroomFilter.lte = parsed.bedrooms.max;
      filterClauses.push({ range: { bedrooms: bedroomFilter } });
    }

    if (parsed.bathrooms) {
      const bathroomFilter: any = {};
      if (parsed.bathrooms.min !== undefined)
        bathroomFilter.gte = parsed.bathrooms.min;
      if (parsed.bathrooms.max !== undefined)
        bathroomFilter.lte = parsed.bathrooms.max;
      filterClauses.push({ range: { bathrooms: bathroomFilter } });
    }

    if (parsed.price) {
      const priceFilter: any = {};
      if (parsed.price.min !== undefined) priceFilter.gte = parsed.price.min;
      if (parsed.price.max !== undefined) priceFilter.lte = parsed.price.max;
      filterClauses.push({ range: { price: priceFilter } });
    }

    if (parsed.area) {
      const areaFilter: any = {};
      if (parsed.area.min !== undefined) areaFilter.gte = parsed.area.min;
      if (parsed.area.max !== undefined) areaFilter.lte = parsed.area.max;
      filterClauses.push({ range: { area: areaFilter } });
    }

    if (parsed.features && parsed.features.length > 0) {
      for (const feature of parsed.features) {
        if (feature === 'parking') {
          filterClauses.push({ term: { has_parking: true } });
        } else if (feature === 'storage') {
          filterClauses.push({ term: { has_storage: true } });
        } else if (feature === 'balcony') {
          filterClauses.push({ term: { has_balcony: true } });
        } else if (feature === 'newly_built') {
          filterClauses.push({
            range: {
              year_built: {
                gte: new Date().getFullYear() - 5,
              },
            },
          });
        } else if (feature === 'documented') {
          filterClauses.push({ term: { title_deed_type: 'سندی' } });
        }
      }
    }
    if (parsed.location && typeof parsed.location === 'string') {
      mustClauses.push({
        multi_match: {
          query: parsed.location,
          fields: [
            'location.neighborhood',
            'location.city',
            'location.district',
            'title',
            'description',
          ],
        },
      });
    }

    if (mustClauses.length === 0 && filterClauses.length === 0) {
      return { match_all: {} };
    }
    if (mustClauses.length === 0 && filterClauses.length > 0) {
      // If only filters are present, Elasticsearch expects a match_all in must or bool.filter directly
      return { bool: { filter: filterClauses } };
    }

    return {
      bool: {
        ...(mustClauses.length > 0 && { must: mustClauses }),
        ...(filterClauses.length > 0 && { filter: filterClauses }),
      },
    };
  }

  private buildSort(sortBy?: string, sortOrder?: string): Sort {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'price':
        return [{ price: { order } }];
      case 'date':
        return [{ updated_at: { order } }];
      case 'relevance':
      default:
        // For default relevance, if there's no query text, _score might not be meaningful.
        // Consider sorting by a default field like 'updated_at' if sortBy is 'relevance' but no query text exists.
        // However, for now, sticking to _score for simplicity.
        return [{ _score: { order: 'desc' } }];
    }
  }
}
