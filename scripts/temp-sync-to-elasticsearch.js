// sync-to-elasticsearch.js
const { Client } = require('@elastic/elasticsearch');
const { Pool } = require('pg');

// Configure connections
const pgPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/postgres',
});

const esClient = new Client({
  node: 'http://localhost:9200',
});

async function syncPropertiesToElasticsearch() {
  try {
    console.log('Starting sync...');

    // Get properties from PostgreSQL
    const { rows } = await pgPool.query(`
      SELECT
        id, external_id, title, description, price, price_per_meter,
        bedrooms, bathrooms, area, year_built,
        ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude,
        has_elevator, has_parking, has_storage, has_balcony
      FROM properties
    `);

    console.log(`Found ${rows.length} properties to sync`);

    if (rows.length === 0) {
      console.log('No properties to sync');
      return;
    }

    // Format for Elasticsearch bulk API
    const body = rows.flatMap((property) => [
      { index: { _index: 'properties', _id: property.id } },
      {
        id: property.id,
        external_id: property.external_id,
        title: property.title,
        description: property.description,
        price: property.price,
        price_per_meter: property.price_per_meter,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        year_built: property.year_built,
        location: {
          lat: property.latitude,
          lon: property.longitude,
        },
        amenities: [
          ...(property.has_elevator ? ['elevator'] : []),
          ...(property.has_parking ? ['parking'] : []),
          ...(property.has_storage ? ['storage'] : []),
          ...(property.has_balcony ? ['balcony'] : []),
        ],
      },
    ]);

    // Send to Elasticsearch
    const result = await esClient.bulk({ refresh: true, body });

    if (result.errors) {
      console.error(
        'Errors during bulk insert:',
        result.items.filter((item) => item.index.error)
      );
    } else {
      console.log(
        `Successfully synced ${rows.length} properties to Elasticsearch`
      );
    }
  } catch (error) {
    console.error('Error syncing properties:', error);
  } finally {
    await pgPool.end();
  }
}

syncPropertiesToElasticsearch();
