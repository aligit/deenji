// apps/migrations/src/elasticsearch-sync-simple.ts
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

// Configuration interface
interface SyncConfig {
  batchSize: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logDir: string;
  dryRun: boolean;
  limit?: number;
  recreateIndex: boolean;
  elasticsearchUrl: string;
}

// Default configuration
const defaultConfig: SyncConfig = {
  batchSize: 50,
  logLevel: 'info',
  logToFile: true,
  logDir: './logs',
  dryRun: false,
  recreateIndex: false,
  elasticsearchUrl: 'http://localhost:9200',
};

// Logger implementation (reusing from your migration script)
class Logger {
  private config: SyncConfig;
  private logStream: fs.FileHandle | null = null;
  private logFile: string;

  constructor(config: SyncConfig) {
    this.config = config;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(config.logDir, `es-sync-${timestamp}.log`);
  }

  async init(): Promise<void> {
    if (this.config.logToFile) {
      try {
        await fs.mkdir(this.config.logDir, { recursive: true });
        this.logStream = await fs.open(this.logFile, 'a');
      } catch (err) {
        console.error(`Failed to create log file: ${err.message}`);
      }
    }
  }

  private async writeToFile(message: string): Promise<void> {
    if (this.logStream) {
      const timestamp = new Date().toISOString();
      await this.logStream.write(`[${timestamp}] ${message}\n`);
    }
  }

  debug(message: string): void {
    if (this.config.logLevel === 'debug') {
      console.debug(`[DEBUG] ${message}`);
      this.writeToFile(`[DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    if (['debug', 'info'].includes(this.config.logLevel)) {
      console.info(`[INFO] ${message}`);
      this.writeToFile(`[INFO] ${message}`);
    }
  }

  warn(message: string): void {
    if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
      console.warn(`[WARN] ${message}`);
      this.writeToFile(`[WARN] ${message}`);
    }
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`);
    if (error) console.error(error);
    this.writeToFile(`[ERROR] ${message}${error ? `: ${error.message}` : ''}`);
  }

  async close(): Promise<void> {
    if (this.logStream) {
      await this.logStream.close();
    }
  }
}

// Result interface
interface SyncResult {
  indexed: number;
  errors: number;
  errorIds: number[];
}

// Property interface for Elasticsearch
interface PropertyDocument {
  id: number;
  title: string;
  description?: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms?: number;
  year_built?: number;
  location?: {
    lat: number;
    lon: number;
  };
  amenities?: string[];
}

// Main sync class
class ElasticsearchSync {
  private pgClient: postgres.Sql<Record<string, never>>;
  private config: SyncConfig;
  private logger: Logger;
  private indexName = 'properties';

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Use ELASTICSEARCH_URL if available
    if (process.env.ELASTICSEARCH_URL) {
      this.config.elasticsearchUrl = process.env.ELASTICSEARCH_URL;
    }

    this.logger = new Logger(this.config);

    // Initialize PostgreSQL client
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.pgClient = postgres(process.env.DATABASE_URL);
  }

  // Simple fetch wrapper
  private async fetchES(
    path: string,
    method = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.config.elasticsearchUrl}${path}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Elasticsearch error: ${response.status} ${response.statusText}`
      );
    }

    return response.status !== 204 ? await response.json() : null;
  }

  // Check if index exists
  private async indexExists(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.elasticsearchUrl}/${this.indexName}`
      );
      return response.status === 200;
    } catch (err) {
      this.logger.error(`Error checking if index exists: ${err.message}`, err);
      return false;
    }
  }

  // Create index with proper mapping
  private async createIndex(): Promise<void> {
    try {
      await this.fetchES(`/${this.indexName}`, 'PUT', {
        mappings: {
          properties: {
            id: { type: 'integer' },
            title: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            description: { type: 'text' },
            price: { type: 'long' },
            area: { type: 'float' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            year_built: { type: 'integer' },
            location: { type: 'geo_point' },
            amenities: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
          },
        },
      });
      this.logger.info(
        `Created index '${this.indexName}' with proper mappings`
      );
    } catch (err) {
      this.logger.error(`Error creating index: ${err.message}`, err);
      throw err;
    }
  }

  // Extract amenities from attributes JSON
  private extractAmenities(attributes: any[]): string[] {
    const amenities: string[] = [];
    if (!attributes || !Array.isArray(attributes)) return amenities;

    // Extract keys that represent amenities
    const amenityKeys = [
      'ELEVATOR',
      'PARKING',
      'CABINET',
      'BALCONY',
      'WC',
      'SNOWFLAKE',
      'SUNNY',
      'THERMOMETER',
      'TEXTURE',
    ];

    for (const attr of attributes) {
      if (attr.key && amenityKeys.includes(attr.key)) {
        // If it has 'available' property, check it
        if ('available' in attr && attr.available === true) {
          amenities.push(attr.key.toLowerCase());
        }
        // If it doesn't have 'ندارد' in the title (which means "doesn't have")
        else if (attr.title && !attr.title.includes('ندارد')) {
          amenities.push(attr.key.toLowerCase());
        }
      }
    }

    return amenities;
  }

  // Transform PostgreSQL property to Elasticsearch document
  private transformProperty(row: any): PropertyDocument {
    // Extract basic fields
    const doc: PropertyDocument = {
      id: row.id,
      title: row.title || '',
      description: row.description,
      price: typeof row.price === 'number' ? row.price : 0,
      area: parseFloat(row.area) || 0,
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      year_built: row.year_built || 0,
    };

    // Extract location
    if (row.location) {
      try {
        // Parse WKB format to get coordinates
        const locationMatch = row.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (locationMatch && locationMatch.length >= 3) {
          doc.location = {
            lon: parseFloat(locationMatch[1]),
            lat: parseFloat(locationMatch[2]),
          };
        }
      } catch (e) {
        this.logger.warn(`Could not parse location for property ${row.id}`);
      }
    }

    // Extract amenities from attributes
    if (row.attributes && typeof row.attributes === 'object') {
      doc.amenities = this.extractAmenities(row.attributes);
    }

    return doc;
  }

  // Index a single property
  private async indexProperty(property: PropertyDocument): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info(`[DRY RUN] Would index property ${property.id}`);
      return;
    }

    try {
      await this.fetchES(
        `/${this.indexName}/_doc/${property.id}`,
        'PUT',
        property
      );
      this.logger.debug(`Indexed property ${property.id}`);
    } catch (err) {
      this.logger.error(
        `Error indexing property ${property.id}: ${err.message}`,
        err
      );
      throw err;
    }
  }

  // Bulk index properties
  private async bulkIndex(properties: PropertyDocument[]): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info(
        `[DRY RUN] Would bulk index ${properties.length} properties`
      );
      return;
    }

    try {
      // Prepare bulk request body
      let bulkBody = '';
      for (const property of properties) {
        bulkBody +=
          JSON.stringify({
            index: { _index: this.indexName, _id: property.id.toString() },
          }) + '\n';
        bulkBody += JSON.stringify(property) + '\n';
      }

      await this.fetchES('/_bulk', 'POST', bulkBody);
      this.logger.debug(`Bulk indexed ${properties.length} properties`);
    } catch (err) {
      this.logger.error(`Error bulk indexing properties: ${err.message}`, err);
      throw err;
    }
  }

  // Run the sync process
  public async run(): Promise<SyncResult> {
    const result: SyncResult = {
      indexed: 0,
      errors: 0,
      errorIds: [],
    };

    try {
      await this.logger.init();
      this.logger.info(
        `Using Elasticsearch at ${this.config.elasticsearchUrl}`
      );

      // Check if index exists
      const indexExists = await this.indexExists();
      if (!indexExists || this.config.recreateIndex) {
        if (indexExists) {
          this.logger.info(`Deleting existing index '${this.indexName}'`);
          await this.fetchES(`/${this.indexName}`, 'DELETE');
        }
        await this.createIndex();
      }

      // Count total properties
      const countResult = await this.pgClient`SELECT COUNT(*) FROM properties`;
      const totalCount = parseInt(countResult[0]?.count || '0', 10);

      this.logger.info(`Found ${totalCount} properties in PostgreSQL`);
      if (totalCount === 0) {
        this.logger.warn('No properties found in PostgreSQL, nothing to sync');
        return result;
      }

      // Build query with limit if specified
      let query = `
        SELECT
          p.id,
          p.title,
          p.description,
          p.price,
          p.area,
          p.bedrooms,
          p.bathrooms,
          p.year_built,
          ST_AsText(p.location) as location,
          p.attributes,
          p.has_elevator,
          p.has_parking,
          p.has_storage,
          p.has_balcony
        FROM
          properties p
        ORDER BY p.id
      `;

      if (this.config.limit) {
        query += ` LIMIT ${this.config.limit}`;
      }

      // Fetch properties
      const properties = await this.pgClient.unsafe(query);

      // Process in batches
      const batches = [];
      for (let i = 0; i < properties.length; i += this.config.batchSize) {
        batches.push(properties.slice(i, i + this.config.batchSize));
      }

      this.logger.info(
        `Processing ${properties.length} properties in ${batches.length} batches`
      );

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.logger.info(
          `Processing batch ${i + 1}/${batches.length} (${batch.length
          } properties)`
        );

        const transformedBatch = batch.map((property) =>
          this.transformProperty(property)
        );

        try {
          if (!this.config.dryRun) {
            await this.bulkIndex(transformedBatch);
          }
          result.indexed += batch.length;
          this.logger.info(`Successfully indexed batch ${i + 1}`);
        } catch (err) {
          this.logger.error(
            `Error bulk indexing batch ${i + 1}: ${err.message}`,
            err
          );
          // Try individual indexing as fallback
          for (let j = 0; j < batch.length; j++) {
            try {
              const doc = transformedBatch[j];
              await this.indexProperty(doc);
              result.indexed++;
            } catch (err) {
              this.logger.error(`Error indexing property ${batch[j].id}`, err);
              result.errors++;
              result.errorIds.push(batch[j].id);
            }
          }
        }
      }

      // Refresh index to make the documents searchable immediately
      if (!this.config.dryRun && result.indexed > 0) {
        await this.fetchES(`/${this.indexName}/_refresh`, 'POST');
        this.logger.info(`Refreshed index '${this.indexName}'`);
      }
    } catch (err) {
      this.logger.error('Sync failed', err);
      throw err;
    } finally {
      // Close connections
      await this.pgClient.end();
      this.logger.info('PostgreSQL connection closed');
      await this.logger.close();
    }

    return result;
  }
}

// CLI script
async function main() {
  // Load environment variables
  try {
    dotenv.config({ path: '.env.development' });
  } catch (e) {
    try {
      dotenv.config();
    } catch (e) {
      // Ignore if can't load .env files
    }
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const config: Partial<SyncConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run' || arg === '-d') {
      config.dryRun = true;
    } else if (arg === '--batch-size' || arg === '-b') {
      config.batchSize = parseInt(args[++i], 10);
    } else if (arg === '--log-level' || arg === '-l') {
      config.logLevel = args[++i] as any;
    } else if (arg === '--no-log-file') {
      config.logToFile = false;
    } else if (arg === '--log-dir') {
      config.logDir = args[++i];
    } else if (arg === '--limit') {
      config.limit = parseInt(args[++i], 10);
    } else if (arg === '--recreate-index') {
      config.recreateIndex = true;
    } else if (arg === '--elasticsearch-url') {
      config.elasticsearchUrl = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Elasticsearch Sync Script
Usage: bun run src/elasticsearch-sync-simple.ts [options]

Options:
  --dry-run, -d           Run in dry-run mode (no actual indexing)
  --batch-size, -b N      Process properties in batches of N (default: 50)
  --log-level, -l LEVEL   Set log level (debug|info|warn|error) (default: info)
  --no-log-file           Don't write logs to file
  --log-dir PATH          Path to log directory (default: ./logs)
  --limit N               Limit the number of properties to process
  --recreate-index        Delete and recreate the Elasticsearch index
  --elasticsearch-url URL Set Elasticsearch URL (default: http://localhost:9200)
  --help, -h              Show this help message
      `);
      process.exit(0);
    }
  }

  // Run sync
  const sync = new ElasticsearchSync(config);
  const result = await sync.run();

  console.log('\nSync completed:');
  console.log(`- Properties indexed: ${result.indexed}`);
  console.log(`- Errors encountered: ${result.errors}`);
  if (result.errors > 0) {
    console.log(`- Properties with errors: ${result.errorIds.join(', ')}`);
  }
}

// Run the main function if this file is being run directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

// Export the sync class for programmatic usage
export { ElasticsearchSync, type SyncConfig, type SyncResult };
