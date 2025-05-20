#!/bin/bash
# debug_property_type.sh

ES_HOST="http://localhost:9200"
INDEX_NAME="divar_properties"

echo "==================================================="
echo "DEBUGGING PROPERTY_TYPE SEARCH"
echo "==================================================="

# 1. Force a refresh of the index to make updates visible
echo -e "\n1. Refreshing index..."
curl -s -X POST "$ES_HOST/$INDEX_NAME/_refresh"

# 2. Check if the property_type field exists in the mapping
echo -e "\n2. Checking mapping for property_type field..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_mapping" | jq '.divar_properties.mappings.properties.property_type'

# 3. Try to get a specific document to see what's actually stored
echo -e "\n3. Checking the first document's property_type value..."
DOC_ID=$(curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "size": 1,
  "_source": ["property_type", "title"],
  "query": {
    "match_phrase": {
      "title": "آپارتمان"
    }
  }
}' | jq -r '.hits.hits[0]._id')

if [ ! -z "$DOC_ID" ]; then
  curl -s -X GET "$ES_HOST/$INDEX_NAME/_doc/$DOC_ID" | jq '._source.property_type, ._source.title'
else
  echo "No document found with آپارتمان in title"
fi

# 4. Check if there are any documents with property_type field (regardless of value)
echo -e "\n4. Checking for any documents with property_type..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "size": 3,
  "_source": ["property_type", "title"],
  "query": {
    "exists": {
      "field": "property_type"
    }
  }
}' | jq '.hits.total.value, .hits.hits[]._source'

# 5. Try a match query instead of term query
echo -e "\n5. Testing with match query instead of term query..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "size": 3,
  "_source": ["property_type", "title"],
  "query": {
    "match": {
      "property_type": "آپارتمان"
    }
  }
}' | jq '.hits.total.value, .hits.hits[]._source'

# 6. Check for different encoding/normalization of the text
echo -e "\n6. Testing with analyzer on property_type field..."
curl -s -X POST "$ES_HOST/$INDEX_NAME/_analyze" -H 'Content-Type: application/json' -d '{
  "field": "property_type",
  "text": "آپارتمان"
}' | jq '.tokens[].token'

# 7. Create a test document with property_type directly
echo -e "\n7. Creating a test document with property_type explicitly..."
TEST_ID="test_apartment_123"
curl -s -X PUT "$ES_HOST/$INDEX_NAME/_doc/$TEST_ID" -H 'Content-Type: application/json' -d '{
  "title": "Test آپارتمان Document",
  "property_type": "آپارتمان"
}'

# Refresh again
curl -s -X POST "$ES_HOST/$INDEX_NAME/_refresh"

# Check if we can find this test document by property_type
echo -e "\n8. Searching for the test document by property_type..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "term": {
      "property_type": "آپارتمان"
    }
  }
}' | jq '.hits.total.value, .hits.hits[]._source.title'

echo -e "\n==================================================="
echo "DEBUG COMPLETE"
echo "==================================================="
