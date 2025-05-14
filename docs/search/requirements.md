# Multi-Stage Search Requirements - Deenji Backend

## Overview

Backend implementation for multi-stage search functionality using tRPC and Elasticsearch. Location is pre-selected, focusing on property type → bedrooms → price flow.

## Search Flow (Location Pre-Selected)

### Stage 1: Property Type Search

**Persian Terms:**

- `آپارتمان` (Apartment)
- `ویلا` (Villa)
- `خانه` (House)
- `زمین` (Land)

### Stage 2: Bedroom Filter

**Persian Terms:**

- `۲خوابه` (2 bedrooms)
- `۳خوابه` (3 bedrooms)
- `۴خوابه` (4 bedrooms)

### Stage 3: Price Filter

**Persian Terms:**

- `تا` (up to) - e.g., `تا ۱۰ میلیارد`
- `حداقل` (minimum) - e.g., `حداقل ۵ میلیارد`
- `بین` (between) - e.g., `بین ۱۰ میلیارد تا ۲۰ میلیارد`

## Technical Requirements

### 1. Backend APIs (tRPC)

- Property type search endpoint
- Bedroom filter endpoint
- Price filter endpoint
- Combined search endpoint

### 2. Elasticsearch Setup

- Property index with appropriate mappings
- Persian text analysis
- Range queries for price and bedrooms
- Term queries for property types

### 3. Testing Strategy

- Vitest integration tests
- Test each search stage independently
- Test combined search functionality
- Test Persian text handling

## Success Criteria

- [ ] All search stages return correct results
- [ ] Persian text search works accurately
- [ ] Price range queries function properly
- [ ] Bedroom filtering works correctly
- [ ] Combined search maintains accuracy
- [ ] All tests pass with Vitest
