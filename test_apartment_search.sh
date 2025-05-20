#!/bin/bash
# test_apartment_search.sh

ES_HOST="http://localhost:9200"
INDEX_NAME="divar_properties"

echo "==================================================="
echo "TESTING APARTMENT SEARCH"
echo "==================================================="

# Test 1: Search title with match_phrase_prefix - the solution that works right now
echo -e "\n1. Testing match_phrase_prefix for 'آپ' in title..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "match_phrase_prefix": {
      "title": "آپ"
    }
  },
  "size": 3
}' | jq '.hits.total.value, .hits.hits[]._source.title'

# Test 2: Try to count how many documents contain "آپارتمان" in title
echo -e "\n2. Counting documents with \"آپارتمان\" in title..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_count" -H 'Content-Type: application/json' -d '{
  "query": {
    "match_phrase": {
      "title": "آپارتمان"
    }
  }
}' | jq '.count'

# Test 3: Add property_type field to the first 10 matching documents
echo -e "\n3. Adding property_type to apartment documents..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "match_phrase": {
      "title": "آپارتمان"
    }
  },
  "size": 10
}' | jq '.hits.hits[]._id' | while read -r id; do
  # Remove quotes from id
  id=$(echo $id | tr -d '"')
  echo "Updating document $id..."
  curl -s -X POST "$ES_HOST/$INDEX_NAME/_update/$id" -H 'Content-Type: application/json' -d '{
    "doc": {
      "property_type": "آپارتمان"
    }
  }'
  echo
done

# Test 4: Now try property_type search
echo -e "\n4. Testing property_type filter for 'آپارتمان'..."
curl -s -X GET "$ES_HOST/$INDEX_NAME/_search" -H 'Content-Type: application/json' -d '{
  "query": {
    "term": {
      "property_type": "آپارتمان"
    }
  },
  "size": 3
}' | jq '.hits.total.value, .hits.hits[]._source.title'

echo -e "\n==================================================="
echo "TEST COMPLETE"
echo "==================================================="
