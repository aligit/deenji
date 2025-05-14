# Advanced Elasticsearch Architecture - Multi-Stage Search with Suggesters

## Overview

Comprehensive Elasticsearch 8 architecture implementing completion suggester, search-as-you-type, and sophisticated suggestion system for multi-stage real estate search.

## 1. Advanced Index Mappings

### Complete Property Index Mapping

```json
{
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "location": {
        "type": "keyword"
      },
      "property_type": {
        "type": "keyword",
        "fields": {
          "suggest": {
            "type": "completion",
            "contexts": [
              {
                "name": "location",
                "type": "category"
              },
              {
                "name": "stage",
                "type": "category"
              }
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
              {
                "name": "property_type",
                "type": "category"
              }
            ]
          }
        }
      },
      "price": {
        "type": "long"
      },
      "title": {
        "type": "text",
        "analyzer": "persian_standard",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          },
          "suggest": {
            "type": "search_as_you_type",
            "max_shingle_size": 3
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "persian_standard",
        "fields": {
          "suggest": {
            "type": "search_as_you_type",
            "max_shingle_size": 3
          }
        }
      },
      "address": {
        "type": "text",
        "analyzer": "persian_standard"
      },
      "location_suggest": {
        "type": "completion",
        "contexts": [
          {
            "name": "city",
            "type": "category"
          }
        ]
      },
      "price_suggest": {
        "type": "completion",
        "contexts": [
          {
            "name": "property_type",
            "type": "category"
          },
          {
            "name": "bedrooms",
            "type": "category"
          }
        ]
      },
      "searchable_text": {
        "type": "search_as_you_type",
        "analyzer": "persian_standard",
        "max_shingle_size": 4
      },
      "createdAt": {
        "type": "date"
      },
      "status": {
        "type": "keyword"
      }
    }
  }
}
```

## 2. Persian Text Analysis Configuration

### Advanced Persian Analyzer with ICU Support

```json
{
  "settings": {
    "analysis": {
      "char_filter": {
        "persian_char_filter": {
          "type": "mapping",
          "mappings": ["ي=>ی", "ك=>ک", "ة=>ه", "ء=>", "ؤ=>و", "ئ=>ی"]
        }
      },
      "tokenizer": {
        "persian_tokenizer": {
          "type": "icu_tokenizer",
          "rule_files": "Persian"
        }
      },
      "filter": {
        "persian_stop": {
          "type": "stop",
          "stopwords": ["در", "از", "به", "با", "که", "این", "آن", "و", "یا", "را", "تا"]
        },
        "persian_normalization": {
          "type": "icu_normalizer",
          "name": "nfc"
        },
        "persian_folding": {
          "type": "icu_folding"
        }
      },
      "analyzer": {
        "persian_standard": {
          "type": "custom",
          "char_filter": ["persian_char_filter"],
          "tokenizer": "persian_tokenizer",
          "filter": ["persian_normalization", "lowercase", "persian_folding", "persian_stop"]
        },
        "persian_search": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["persian_normalization", "lowercase", "persian_folding"]
        }
      }
    }
  }
}
```

## 3. Completion Suggester Implementation

### Property Type Suggestions

```json
{
  "suggest": {
    "property_type_suggest": {
      "prefix": "آپار",
      "completion": {
        "field": "property_type.suggest",
        "size": 10,
        "contexts": {
          "location": ["تهران"],
          "stage": ["property_type"]
        }
      }
    }
  }
}
```

### Bedroom Suggestions (Context-Aware)

```json
{
  "suggest": {
    "bedroom_suggest": {
      "prefix": "۲",
      "completion": {
        "field": "bedrooms.suggest",
        "size": 5,
        "contexts": {
          "property_type": ["آپارتمان"]
        }
      }
    }
  }
}
```

### Indexed Suggestion Documents

```json
// Property type suggestions
{
  "property_type": "آپارتمان",
  "property_type.suggest": {
    "input": ["آپارتمان", "واحد آپارتمانی", "آپارتمان های تهران"],
    "contexts": {
      "location": ["تهران"],
      "stage": ["property_type"]
    }
  }
}

// Bedroom suggestions
{
  "bedrooms": 2,
  "bedrooms.suggest": {
    "input": ["۲خوابه", "دو خواب", "۲ خوابه"],
    "contexts": {
      "property_type": ["آپارتمان", "ویلا"]
    }
  }
}

// Price suggestions
{
  "price_suggest": {
    "input": ["تا ۱۰ میلیارد", "حداقل ۵ میلیارد", "بین ۱۰ تا ۲۰ میلیارد"],
    "contexts": {
      "property_type": ["آپارتمان"],
      "bedrooms": ["۲خوابه"]
    }
  }
}
```

## 4. Search-as-You-Type Implementation

### Multi-Field Search-as-You-Type Query

```json
{
  "query": {
    "multi_match": {
      "query": "آپارتمان ۳ خواب",
      "type": "bool_prefix",
      "fields": ["title.suggest", "title.suggest._2gram", "title.suggest._3gram", "description.suggest", "searchable_text", "searchable_text._2gram", "searchable_text._3gram"]
    }
  }
}
```

### Progressive Search-as-You-Type

```json
// As user types: آ → آپ → آپار → آپارتمان
{
  "query": {
    "bool": {
      "should": [
        {
          "multi_match": {
            "query": "آپارتمان",
            "type": "bool_prefix",
            "fields": ["title.suggest", "title.suggest._index_prefix"]
          }
        },
        {
          "completion": {
            "property_type.suggest": {
              "prefix": "آپارتمان",
              "size": 5
            }
          }
        }
      ]
    }
  }
}
```

## 5. Progressive Query Building Strategy

### Stage 1: Property Type Selection

```json
{
  "query": {
    "bool": {
      "must": [{ "term": { "location": "تهران" } }, { "term": { "property_type": "آپارتمان" } }, { "term": { "status": "active" } }]
    }
  },
  "suggest": {
    "next_stage": {
      "text": "",
      "completion": {
        "field": "bedrooms.suggest",
        "contexts": {
          "property_type": ["آپارتمان"]
        }
      }
    }
  }
}
```

### Stage 2: Add Bedroom Filter

```json
{
  "query": {
    "bool": {
      "must": [{ "term": { "location": "تهران" } }, { "term": { "property_type": "آپارتمان" } }, { "term": { "bedrooms": 3 } }, { "term": { "status": "active" } }]
    }
  },
  "suggest": {
    "price_suggestions": {
      "text": "",
      "completion": {
        "field": "price_suggest",
        "contexts": {
          "property_type": ["آپارتمان"],
          "bedrooms": ["۳خوابه"]
        }
      }
    }
  },
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "key": "تا ۵ میلیارد", "to": 5000000000 },
          { "key": "۵ تا ۱۰ میلیارد", "from": 5000000000, "to": 10000000000 },
          { "key": "۱۰ تا ۲۰ میلیارد", "from": 10000000000, "to": 20000000000 },
          { "key": "بالای ۲۰ میلیارد", "from": 20000000000 }
        ]
      }
    }
  }
}
```

### Stage 3: Complete Query with Price Filter

```json
{
  "query": {
    "bool": {
      "must": [{ "term": { "location": "تهران" } }, { "term": { "property_type": "آپارتمان" } }, { "term": { "bedrooms": 3 } }, { "term": { "status": "active" } }],
      "filter": [
        {
          "range": {
            "price": {
              "gte": 10000000000,
              "lte": 20000000000
            }
          }
        }
      ]
    }
  },
  "sort": [{ "_score": { "order": "desc" } }, { "price": { "order": "asc" } }]
}
```

## 6. Aggregation-Based Dynamic Suggestions

### Price Range Aggregations

```json
{
  "aggs": {
    "available_prices": {
      "filter": {
        "bool": {
          "must": [{ "term": { "property_type": "آپارتمان" } }, { "term": { "bedrooms": 3 } }]
        }
      },
      "aggs": {
        "price_histogram": {
          "histogram": {
            "field": "price",
            "interval": 1000000000,
            "min_doc_count": 1
          }
        },
        "price_stats": {
          "stats": {
            "field": "price"
          }
        }
      }
    }
  }
}
```

### Dynamic Suggestion Generation

```typescript
// Generate suggestions based on aggregation results
function generatePriceSuggestions(aggs: any) {
  const stats = aggs.available_prices.price_stats;
  const suggestions = [`تا ${formatPrice(stats.max)}`, `حداقل ${formatPrice(stats.min)}`, `بین ${formatPrice(stats.avg - stats.std)} تا ${formatPrice(stats.avg + stats.std)}`];
  return suggestions;
}
```

## 7. Hybrid Suggestion System Architecture

### Multi-Type Suggester Service

```typescript
export class SuggestionService {
  async getPropertyTypeSuggestions(prefix: string, context: any) {
    return await this.client.search({
      index: 'deenji-properties',
      body: {
        suggest: {
          property_type_suggest: {
            prefix,
            completion: {
              field: 'property_type.suggest',
              contexts: context,
            },
          },
        },
      },
    });
  }

  async getBedroomSuggestions(propertyType: string) {
    return await this.client.search({
      index: 'deenji-properties',
      body: {
        suggest: {
          bedroom_suggest: {
            prefix: '',
            completion: {
              field: 'bedrooms.suggest',
              contexts: {
                property_type: [propertyType],
              },
            },
          },
        },
      },
    });
  }

  async getPriceSuggestions(propertyType: string, bedrooms?: number) {
    const must = [{ term: { property_type: propertyType } }];
    if (bedrooms) {
      must.push({ term: { bedrooms } });
    }

    const result = await this.client.search({
      index: 'deenji-properties',
      body: {
        query: { bool: { must } },
        size: 0,
        aggs: {
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
        },
      },
    });

    return this.generatePriceSuggestions(result.aggregations);
  }
}
```

## 8. Search-as-You-Type with Persian Support

### Persian Search-as-You-Type Field

```json
{
  "searchable_text": {
    "type": "search_as_you_type",
    "analyzer": "persian_standard",
    "search_analyzer": "persian_search",
    "max_shingle_size": 4
  }
}
```

### Multi-Match Bool Prefix Query

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "multi_match": {
            "query": "آپارتمان سه خواب",
            "type": "bool_prefix",
            "fields": ["searchable_text", "searchable_text._2gram", "searchable_text._3gram", "searchable_text._index_prefix"]
          }
        },
        {
          "multi_match": {
            "query": "آپارتمان سه خواب",
            "fields": ["title^2", "description"]
          }
        }
      ]
    }
  }
}
```

## 9. Implementation Phases

### Phase 1: Core Mappings & Persian Analysis

```typescript
// 1. Create index with advanced mappings
// 2. Configure Persian analyzer with ICU
// 3. Index test documents
// 4. Verify Persian text search
```

### Phase 2: Completion Suggester

```typescript
// 1. Implement property type completion
// 2. Add bedroom suggestions with context
// 3. Create price suggestion templates
// 4. Test contextual suggestions
```

### Phase 3: Search-as-You-Type

```typescript
// 1. Configure search_as_you_type fields
// 2. Implement bool_prefix queries
// 3. Add Persian text handling
// 4. Optimize for performance
```

### Phase 4: Dynamic Suggestions

```typescript
// 1. Implement aggregation-based price suggestions
// 2. Add suggestion caching
// 3. Create hybrid suggestion system
// 4. Performance optimization
```

## 10. Advanced Query Examples

### Combined Search with Suggestions

```json
{
  "query": {
    "bool": {
      "must": [{ "term": { "location": "تهران" } }, { "term": { "property_type": "آپارتمان" } }],
      "should": [
        {
          "multi_match": {
            "query": "سه خواب",
            "type": "bool_prefix",
            "fields": ["title.suggest", "description.suggest"]
          }
        }
      ]
    }
  },
  "suggest": {
    "bedroom_complete": {
      "prefix": "سه",
      "completion": {
        "field": "bedrooms.suggest",
        "contexts": { "property_type": ["آپارتمان"] }
      }
    },
    "text_complete": {
      "text": "سه خواب",
      "term": {
        "field": "searchable_text"
      }
    }
  },
  "highlight": {
    "fields": {
      "title": {},
      "description": {}
    }
  }
}
```

### Function Score for Relevance

```json
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [{ "term": { "property_type": "آپارتمان" } }, { "term": { "bedrooms": 3 } }]
        }
      },
      "functions": [
        {
          "filter": { "term": { "status": "active" } },
          "weight": 1.5
        },
        {
          "gauss": {
            "price": {
              "origin": 10000000000,
              "scale": 5000000000,
              "decay": 0.5
            }
          }
        }
      ],
      "boost_mode": "multiply"
    }
  }
}
```

This comprehensive architecture provides all the advanced features you mentioned: completion suggesters, search-as-you-type, sophisticated query building, and aggregation-based dynamic suggestions, all optimized for Persian text and your multi-stage search flow.
