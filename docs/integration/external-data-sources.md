# External Data Sources Integration

## Overview

The Deenji platform integrates with external data sources to continuously update its property database. The primary external source is a Python-based crawler that scrapes real estate listings from Divar.ir (Tehran market).

## Crawler System Architecture

### Technology Stack

- **Language**: Python 3.9+
- **Web Crawling**: Crawl4AI with Playwright (Chromium)
- **Database**: AsyncPG for PostgreSQL connections
- **Search Engine**: Elasticsearch 8.x
- **HTTP Client**: AIOHTTP for API calls
- **HTML Parsing**: BeautifulSoup4 with lxml

### Anti-Detection Measures

- Proxy support (HTTP/HTTPS)
- Random user agent rotation
- Dynamic delays between requests (1-5 seconds)
- Browser viewport randomization
- Rate limiting with exponential backoff
- Human behavior simulation (scrolling, waiting)

## Data Flow

```mermaid
graph TB
    A[Divar.ir API] --> B[Crawler System]
    B --> C[Property Extraction]
    C --> D[Data Transformation]
    D --> E[PostgreSQL Database]
    D --> F[Elasticsearch Index]
    E --> G[Deenji Platform]
    F --> G
```

### 1. Property Discovery

- Fetches property tokens from Divar search API (`/v8/postlist/w/search`)
- Supports pagination using `sort_date` cursors
- Targets Tehran market (city_id: 1)
- Configurable page limits and concurrent crawling

### 2. Property Detail Extraction

#### HTML Extraction

- **Title**: Property title from H1 elements
- **Description**: Full property description
- **Images**: All property images from carousel
- **Location**: Geographic and textual location data

#### API Data Extraction

From Divar's `/v8/posts-v2/web/{token}` endpoint:

- **Basic Info**: Area, bedrooms, price, year built
- **Features**: Parking, storage, balcony availability
- **Advanced**: Floor material, heating/cooling systems
- **Property Type**: Apartment, house, commercial, etc.

### 3. Data Transformation

#### Persian Text Handling

- Converts Persian/Arabic numerals to Latin (۰۱۲ → 012)
- Normalizes text encoding
- Handles RTL text properly

#### Data Mapping

```json
{
  "p_external_id": "Divar token",
  "p_title": "Property title",
  "p_description": "Full description",
  "p_price": "Price in Rials",
  "p_area": "Area in square meters",
  "p_bedrooms": "Number of bedrooms",
  "p_has_parking": "Boolean for parking",
  "p_attributes": "JSON array of all attributes",
  "p_image_urls": "Array of image URLs",
  "p_location": "Location object with neighborhood/city"
}
```

## Database Integration

### PostgreSQL Storage

- Uses `insert_property_direct()` stored procedure
- Handles duplicate detection via `external_id`
- Supports upserts for existing properties
- Stores structured attributes as JSONB

### Connection Management

- AsyncPG connection pooling (1-10 connections)
- Automatic retry on connection failures
- Timeout handling (30 seconds)
- Graceful degradation when DB unavailable

## Elasticsearch Indexing

### Index Structure

- **Primary Index**: `divar_properties`
- **Suggestion Index**: `divar_suggestions`

### Persian Text Analysis

- Custom Persian normalizer
- Standard tokenizer with lowercase filter
- Search-as-you-type fields for suggestions

### Automatic Suggestions

Generates contextual suggestions for:

- Location-based searches
- Property type + location combinations
- Bedroom count filters
- Price range filters
- Feature-based filters (parking, storage, etc.)

## Error Handling

### Retry Logic

- API failures: 3 retries with exponential backoff
- Database errors: Single retry with logging
- Elasticsearch errors: Continue without indexing

### Monitoring

- Structured logging (JSON format)
- Success/failure rate tracking
- Performance metrics (response times)
- Alert on consecutive failures

## Configuration

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
ELASTICSEARCH_URL=http://localhost:9200
HTTP_PROXY=http://proxy:port
HTTPS_PROXY=http://proxy:port
```

### Crawler Settings

- `PAGES_TO_CRAWL`: Number of API pages to process
- `MAX_CONCURRENT_CRAWLS`: Parallel crawling limit
- `TARGET_CITY_ID`: Divar city identifier
- Rate limiting: 2-5 seconds between requests

## API Integration Points

### Expected Data Format (PostgreSQL)

The crawler uses the following stored procedure:

```sql
SELECT insert_property_direct(
    p_external_id,
    p_title,
    p_description,
    p_price,
    p_location,
    p_attributes,
    p_image_urls,
    -- ... other parameters
);
```

### Elasticsearch Document Format

```json
{
  "external_id": "Aae8wB29",
  "title": "آپارتمان 85 متری در تهران",
  "description": "...",
  "price": 15000000000,
  "area": 85,
  "bedrooms": 2,
  "location": {
    "neighborhood": "ونک",
    "city": "تهران",
    "coordinates": [51.4086, 35.7575]
  },
  "has_parking": true,
  "has_storage": false,
  "attributes": [...]
}
```

## Health Checks & Monitoring

### Crawler Status

- Properties processed per hour
- Success/failure rates
- Database connection health
- Elasticsearch indexing status

### Data Quality Checks

- Required fields validation
- Price range sanity checks
- Image URL accessibility
- Location data completeness

## Integration with Deenji Platform

The crawled data integrates with Deenji through:

1. **Search API**: Elasticsearch indices power the search functionality
2. **Property Display**: Database records provide detailed property information
3. **Analytics**: Aggregated data for market trends and insights
4. **Recommendations**: Property attributes enable similar property suggestions

## Development & Testing

### Local Setup

1. Clone crawler repository
2. Install Python dependencies
3. Configure PostgreSQL and Elasticsearch
4. Set environment variables
5. Run crawler with test mode

### Testing Modes

- **API Only**: Test data extraction without HTML crawling
- **Single Property**: Test specific property by token
- **Limited Pages**: Reduce page count for quick testing

## Deployment Considerations

### Production Requirements

- Stable internet connection with proxy support
- Sufficient disk space for JSON output files
- PostgreSQL and Elasticsearch access
- Monitoring and alerting setup

### Scaling Options

- Multiple crawler instances with different city targets
- Distributed crawling with message queues
- Kubernetes deployment for auto-scaling
- Separate indexing service for Elasticsearch

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Increase delays, check proxy settings
2. **Database Timeouts**: Review connection pooling settings
3. **Missing Data**: Check HTML selectors and API responses
4. **Elasticsearch Errors**: Verify mapping compatibility

### Debug Tools

- Save failed HTML for inspection
- JSON output files for data verification
- Structured logs for error analysis
- Test mode for specific properties
