// src/server/mappings/property.mapping.ts

/**
 * Elasticsearch mapping for the properties index
 * Based on the Divar properties schema with Persian language support
 */

// Property index mapping
export const propertyMappings = {
  properties: {
    id: { type: 'keyword' },
    external_id: { type: 'keyword' },

    // Text fields with Persian analyzer
    title: {
      type: 'text',
      analyzer: 'persian',
    },
    description: {
      type: 'text',
      analyzer: 'persian',
    },

    // Numeric fields
    price: { type: 'long' },
    price_per_meter: { type: 'long' },
    bedrooms: { type: 'integer' },
    bathrooms: { type: 'float' },
    area: { type: 'long' },
    land_area: { type: 'long' },
    year_built: { type: 'integer' },

    // Boolean fields
    has_parking: { type: 'boolean' },
    has_storage: { type: 'boolean' },
    has_balcony: { type: 'boolean' },

    // Keyword fields (enumeration types)
    property_type: { type: 'keyword' },
    bathroom_type: { type: 'keyword' },
    building_direction: { type: 'keyword' },
    cooling_system: { type: 'keyword' },
    heating_system: { type: 'keyword' },
    hot_water_system: { type: 'keyword' },
    floor_info: { type: 'keyword' },
    floor_material: { type: 'keyword' },
    renovation_status: { type: 'keyword' },
    title_deed_type: { type: 'keyword' },

    // Array of keywords
    image_urls: { type: 'keyword' },

    // Geo location
    location: {
      properties: {
        coordinates: { type: 'geo_point' },
        city: { type: 'keyword' },
        district: { type: 'keyword' },
        neighborhood: { type: 'keyword' },
      },
    },

    // Date fields
    created_at: { type: 'date' },
    updated_at: { type: 'date' },
  },
};

// Index settings including analyzer configurations
export const propertySettings = {
  'index.number_of_shards': 1,
  'index.number_of_replicas': 1,
  analysis: {
    filter: {
      persian_normalizer: { type: 'persian_normalization' },
    },
    analyzer: {
      persian: {
        filter: ['lowercase', 'persian_normalizer'],
        tokenizer: 'standard',
      },
    },
  },
};

// Suggestions index mapping
export const suggestionsMappings = {
  properties: {
    suggestion_text: {
      type: 'search_as_you_type',
      doc_values: false,
      max_shingle_size: 3,
      analyzer: 'persian',
    },
    suggestion_type: { type: 'keyword' },
    city: { type: 'keyword' },
    district: { type: 'keyword' },
    neighborhood: { type: 'keyword' },
    property_types: { type: 'keyword' },
    features: { type: 'keyword' },
    min_price: { type: 'long' },
    max_price: { type: 'long' },
    min_bedrooms: { type: 'integer' },
    max_bedrooms: { type: 'integer' },
    priority: { type: 'integer' },
    context: { type: 'keyword' },
    created_at: { type: 'date' },
  },
};

// Suggestion index settings
export const suggestionsSettings = {
  'index.number_of_shards': 1,
  'index.number_of_replicas': 1,
  analysis: {
    filter: {
      persian_normalizer: { type: 'persian_normalization' },
    },
    analyzer: {
      persian: {
        filter: ['lowercase', 'persian_normalizer'],
        tokenizer: 'standard',
      },
    },
  },
};
