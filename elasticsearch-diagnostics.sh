#!/bin/bash
# elasticsearch-diagnostics.sh

ES_HOST="http://localhost:9200"
INDEX_NAME="divar_properties"

echo "========================================"
echo "ELASTICSEARCH DIAGNOSTICS"
echo "========================================"

# Check analyzer settings
echo -e "\n1. Checking analyzer settings..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_settings?pretty" | grep -A 15 "analysis"

# Check sample documents to see what's actually in the index
echo -e "\n2. Sample of documents (first 3)..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 3,
  "_source": ["title", "property_type", "description"]
}'

# Search for documents with property_type = apartment
echo -e "\n3. Searching for documents with property_type = \"آپارتمان\"..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "term": {
      "property_type": "آپارتمان"
    }
  },
  "size": 3,
  "_source": ["title", "property_type", "description"]
}'

# Check how analyzer handles partial matching
echo -e "\n4. Testing how the analyzer processes \"آپ\"..."
curl -s -X POST "$ES_HOST/$INDEX_NAME/_analyze?pretty" -H "Content-Type: application/json" -d '{
  "analyzer": "persian",
  "text": "آپ"
}'

# Check how analyzer handles the full word
echo -e "\n5. Testing how the analyzer processes \"آپارتمان\"..."
curl -s -X POST "$ES_HOST/$INDEX_NAME/_analyze?pretty" -H "Content-Type: application/json" -d '{
  "analyzer": "persian",
  "text": "آپارتمان"
}'

# Test a match_phrase_prefix query (might work better for partial matching)
echo -e "\n6. Testing match_phrase_prefix query for \"آپ\"..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "match_phrase_prefix": {
      "title": "آپ"
    }
  },
  "size": 3,
  "_source": ["title", "property_type", "description"]
}'

# Count property types to see what we have
echo -e "\n7. Counting documents by property_type..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 0,
  "aggs": {
    "property_types": {
      "terms": {
        "field": "property_type",
        "size": 20
      }
    }
  }
}'

echo -e "\n========================================"
