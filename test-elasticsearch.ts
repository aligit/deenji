// test-elasticsearch.ts
import { ElasticsearchService } from './deenji/src/server/services/elasticsearch.service';

async function testElasticsearchSearch() {
  console.log('Starting Elasticsearch direct test...');

  // Create a real instance of the ElasticsearchService
  const service = new ElasticsearchService();

  try {
    // Test searching for "آپ" (partial for آپارتمان/apartment)
    console.log('Searching for "آپ"...');
    const result = await service.searchProperties({
      q: 'آپ',
      page: 1,
      pageSize: 10,
      sortBy: 'relevance',
      sortOrder: 'asc',
    });

    console.log(`Found ${result.total} properties matching "آپ"`);

    // Log the first few results
    console.log('First few results:');
    result.results.slice(0, 3).forEach((property, index) => {
      console.log(`[${index + 1}] ${property.title} (ID: ${property.id})`);
    });

    // Check if any property contains آپارتمان in the title
    const apartmentFound = result.results.some(
      (property) =>
        property.title && property.title.toLowerCase().includes('آپارتمان')
    );

    console.log('Found apartments with آپارتمان in title:', apartmentFound);

    // Test property_type filter directly (if available in your schema)
    console.log('\nTesting property_type filter for آپارتمان...');
    const propertyTypeResult = await service.searchProperties({
      property_type: 'آپارتمان',
      page: 1,
      pageSize: 10,
      sortBy: 'relevance',
      sortOrder: 'asc',
    });

    console.log(
      `Found ${propertyTypeResult.total} properties with property_type = آپارتمان`
    );

    return {
      textSearchSuccessful: result.total > 0 && apartmentFound,
      propertyTypeFilterSuccessful: propertyTypeResult.total > 0,
    };
  } catch (error) {
    console.error('Error during search test:', error);
    return {
      textSearchSuccessful: false,
      propertyTypeFilterSuccessful: false,
      error,
    };
  }
}

// Run the test
testElasticsearchSearch()
  .then((results) => {
    console.log('\nTest Results:', results);
    process.exit(
      results.textSearchSuccessful && results.propertyTypeFilterSuccessful
        ? 0
        : 1
    );
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
