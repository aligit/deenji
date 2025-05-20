#!/bin/bash
# test-elasticsearch.sh

# Default values
ES_HOST="http://localhost:9200"
INDEX_NAME="divar_properties"

echo "========================================"
echo "DIRECT ELASTICSEARCH TEST"
echo "========================================"
echo "Testing Elasticsearch for apartment search"
echo "Host: $ES_HOST"
echo "Index: $INDEX_NAME"
echo "========================================"

# Check if Elasticsearch is running
echo -e "\n1. Checking if Elasticsearch is running..."
ES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $ES_HOST)

if [ "$ES_STATUS" != "200" ]; then
  echo "❌ Error: Elasticsearch is not running or not accessible at $ES_HOST (status: $ES_STATUS)"
  exit 1
else
  echo "✅ Elasticsearch is running"
fi

# Check if the index exists
echo -e "\n2. Checking if index '$INDEX_NAME' exists..."
INDEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $ES_HOST/$INDEX_NAME)

if [ "$INDEX_STATUS" != "200" ]; then
  echo "❌ Error: Index '$INDEX_NAME' does not exist (status: $INDEX_STATUS)"
  exit 1
else
  echo "✅ Index exists"
fi

# Test 1: Search for "آپ" (partial match for apartment)
echo -e "\n3. Testing partial text search for 'آپ' (آپارتمان)..."
SEARCH_RESULT=$(curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "multi_match": {
      "query": "آپ",
      "fields": ["title^3", "description"],
      "fuzziness": "AUTO"
    }
  },
  "size": 3
}')

TOTAL_HITS=$(echo $SEARCH_RESULT | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TOTAL_HITS" ] || [ "$TOTAL_HITS" -eq 0 ]; then
  echo "❌ No results found for 'آپ'"
  echo "Raw response:"
  echo "$SEARCH_RESULT" | grep -o '"error":{[^}]*}'
else
  echo "✅ Found $TOTAL_HITS results for 'آپ'"
  echo "First few results:"
  echo "$SEARCH_RESULT" | grep -o '"title":"[^"]*"' | head -3
fi

# Test 2: Filter by property_type
echo -e "\n4. Testing property_type filter for 'آپارتمان'..."
FILTER_RESULT=$(curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "property_type": "آپارتمان"
          }
        }
      ]
    }
  },
  "size": 3
}')

FILTER_HITS=$(echo $FILTER_RESULT | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$FILTER_HITS" ] || [ "$FILTER_HITS" -eq 0 ]; then
  echo "❌ No results found for property_type = 'آپارتمان'"
  echo "Raw response:"
  echo "$FILTER_RESULT" | grep -o '"error":{[^}]*}'
else
  echo "✅ Found $FILTER_HITS results with property_type = 'آپارتمان'"
  echo "First few results:"
  echo "$FILTER_RESULT" | grep -o '"title":"[^"]*"' | head -3
fi

# Test 3: Test search-as-you-type suggestions
echo -e "\n5. Testing search suggestions for 'آپ'..."
SUGGESTIONS_RESULT=$(curl -s -X GET "$ES_HOST/divar_suggestions/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "multi_match": {
      "query": "آپ",
      "fields": ["suggestion_text", "suggestion_text._2gram", "suggestion_text._3gram"]
    }
  },
  "size": 5
}')

SUGGESTIONS_HITS=$(echo $SUGGESTIONS_RESULT | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SUGGESTIONS_HITS" ] || [ "$SUGGESTIONS_HITS" -eq 0 ]; then
  echo "❌ No suggestions found for 'آپ'"
  echo "This might be normal if you haven't configured suggestions separately"
  echo "Raw response:"
  echo "$SUGGESTIONS_RESULT" | grep -o '"error":{[^}]*}'
else
  echo "✅ Found $SUGGESTIONS_HITS suggestions for 'آپ'"
  echo "First few suggestions:"
  echo "$SUGGESTIONS_RESULT" | grep -o '"suggestion_text":"[^"]*"' | head -3
fi

echo -e "\n========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Elasticsearch status: RUNNING"
echo "Index status: EXISTS"
echo "Partial text search: $([ "$TOTAL_HITS" -gt 0 ] && echo "✅ WORKING ($TOTAL_HITS results)" || echo "❌ NOT WORKING")"
echo "Property type filter: $([ "$FILTER_HITS" -gt 0 ] && echo "✅ WORKING ($FILTER_HITS results)" || echo "❌ NOT WORKING")"
echo "Search suggestions: $([ "$SUGGESTIONS_HITS" -gt 0 ] && echo "✅ WORKING ($SUGGESTIONS_HITS suggestions)" || echo "⚠️ NOT CONFIGURED OR NOT WORKING")"
echo "========================================"

if [ "$TOTAL_HITS" -gt 0 ] || [ "$FILTER_HITS" -gt 0 ]; then
  echo "✅ OVERALL: Basic search functionality is working!"
else
  echo "❌ OVERALL: Search functionality is NOT working properly!"
fi
