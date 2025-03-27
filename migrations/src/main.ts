// apps/migrations/src/main.ts
import { MongoClient } from 'mongodb';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

// MongoDB Property Interface
interface MongoProperty {
  _id: { $oid: string };
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  attributes: Array<{
    title: string;
    value?: string;
    key?: string;
    available?: boolean;
  }>;
  'Property Investment Score'?: number;
  'Market Trend Prediction'?: string;
  'Similar Properties Comparison'?: string[];
  'Property Highlight Flags'?: string[];
  'Neighborhood Fit Score'?: number;
  'Price Trend'?: (number | { $numberLong: string })[];
  'r/p'?: number;
}

// Import result interface
interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorIds: string[];
}

// Configuration interface
interface MigrationConfig {
  batchSize: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logDir: string;
  mongoCollection: string;
  mongoDatabase: string;
  dryRun: boolean;
  limit?: number;
}

// Default configuration
const defaultConfig: MigrationConfig = {
  batchSize: 50,
  logLevel: 'info',
  logToFile: true,
  logDir: './logs',
  mongoCollection: 'ads',
  mongoDatabase: '',
  dryRun: false,
};

// Logger implementation
class Logger {
  private config: MigrationConfig;
  private logStream: fs.FileHandle | null = null;
  private logFile: string;

  constructor(config: MigrationConfig) {
    this.config = config;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(config.logDir, `migration-${timestamp}.log`);
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

// Main migration class
class PropertyMigration {
  private mongoClient: MongoClient;
  // Use Record<string, never> instead of {} to satisfy ESLint
  private pgClient: postgres.Sql<Record<string, never>>;
  private db: ReturnType<typeof drizzle>;
  private config: MigrationConfig;
  private logger: Logger;

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.logger = new Logger(this.config);

    // Initialize MongoDB client
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    this.mongoClient = new MongoClient(process.env.MONGO_URI);

    // Initialize PostgreSQL client
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.pgClient = postgres(process.env.DATABASE_URL);
    this.db = drizzle(this.pgClient);
  }

  // Extract price in Tomans from property attributes
  private extractPrice(property: MongoProperty): number {
    // First try to find price from attributes array
    const priceAttribute = property.attributes.find(
      (attr) => attr.title === 'قیمت کل'
    );
    if (priceAttribute && priceAttribute.value) {
      // Extract numeric part from the price value (e.g., "۸۷۰٬۰۰۰٬۰۰۰ تومان")
      const match = priceAttribute.value.match(/([۰-۹\d,٬]+)/);
      if (match) {
        // Remove separators and convert Persian digits to Latin
        const persianDigits = match[1].replace(/[,٬]/g, '');
        const latinDigits = persianDigits
          .replace(/۰/g, '0')
          .replace(/۱/g, '1')
          .replace(/۲/g, '2')
          .replace(/۳/g, '3')
          .replace(/۴/g, '4')
          .replace(/۵/g, '5')
          .replace(/۶/g, '6')
          .replace(/۷/g, '7')
          .replace(/۸/g, '8')
          .replace(/۹/g, '9');

        return parseInt(latinDigits, 10);
      }
    }

    // If no price found in attributes, check Price Trend (last value)
    if (property['Price Trend'] && property['Price Trend'].length > 0) {
      const lastPrice =
        property['Price Trend'][property['Price Trend'].length - 1];
      if (typeof lastPrice === 'number') {
        return lastPrice;
      } else if (typeof lastPrice === 'object' && '$numberLong' in lastPrice) {
        return parseInt(lastPrice.$numberLong, 10);
      }
    }

    this.logger.warn(`Could not determine price for property ${property.id}`);
    return 0;
  }

  // Check if a property already exists in PostgreSQL
  private async propertyExists(externalId: string): Promise<boolean> {
    const result = await this
      .pgClient`SELECT EXISTS(SELECT 1 FROM properties WHERE external_id = ${externalId}) as exists`;
    return result[0]?.exists || false;
  }

  // Import a single property
  private async importProperty(property: MongoProperty): Promise<number> {
    const priceInTomans = this.extractPrice(property);

    if (this.config.dryRun) {
      this.logger.info(
        `[DRY RUN] Would import property ${property.id} with price ${priceInTomans} tomans`
      );
      return 0;
    }

    // Make sure we have valid values for the function call
    const investmentScore = property['Property Investment Score'] || 0;
    const marketTrend = property['Market Trend Prediction'] || 'Stable';
    const neighborhoodFit = property['Neighborhood Fit Score'] || 0;
    const rentToPriceRatio = property['r/p'] || 0;
    const highlightFlags = JSON.stringify(
      property['Property Highlight Flags'] || []
    );
    const similarProperties = JSON.stringify(
      property['Similar Properties Comparison'] || []
    );

    // Call the PostgreSQL function to import the property
    const result = await this.pgClient`
      SELECT import_mongodb_property(
        ${property.id},
        ${property.title},
        ${property.description},
        ${priceInTomans * 10},
        ${JSON.stringify(property.location || { latitude: 0, longitude: 0 })},
        ${JSON.stringify(property.attributes)},
        ${JSON.stringify(property.image_urls)},
        ${investmentScore},
        ${marketTrend},
        ${neighborhoodFit},
        ${rentToPriceRatio},
        ${highlightFlags},
        ${similarProperties}
      ) AS import_mongodb_property
    `;

    return result[0]?.import_mongodb_property || 0;
  }

  // Run the migration process
  public async run(): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      errorIds: [],
    };

    try {
      await this.logger.init();

      // Connect to MongoDB
      await this.mongoClient.connect();
      this.logger.info('Connected to MongoDB');

      // Get database and collection
      const dbName =
        this.config.mongoDatabase || this.mongoClient.options.dbName;
      this.logger.info(`Using MongoDB database: ${dbName}`);

      const database = this.mongoClient.db(dbName);
      const collection = database.collection<MongoProperty>(
        this.config.mongoCollection
      );
      this.logger.info(
        `Using MongoDB collection: ${this.config.mongoCollection}`
      );

      // List all collections to help debug
      const collections = await database.listCollections().toArray();
      this.logger.info(
        `Available collections: ${collections.map((c) => c.name).join(', ')}`
      );

      // Get total count
      const totalCount = await collection.countDocuments();
      this.logger.info(
        `Found ${totalCount} properties in MongoDB collection ${this.config.mongoCollection}`
      );

      // Process in batches
      let processed = 0;
      const cursor = collection.find();
      if (this.config.limit) {
        cursor.limit(this.config.limit);
      }

      const properties = await cursor.toArray();
      const batches = [];

      for (let i = 0; i < properties.length; i += this.config.batchSize) {
        batches.push(properties.slice(i, i + this.config.batchSize));
      }

      this.logger.info(
        `Processing ${properties.length} properties in ${batches.length} batches`
      );

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.logger.info(
          `Processing batch ${i + 1}/${batches.length} (${batch.length
          } properties)`
        );

        for (const property of batch) {
          try {
            // Check if property already exists
            const exists = await this.propertyExists(property.id);

            if (exists) {
              this.logger.debug(
                `Property ${property.id} already exists, skipping...`
              );
              result.skipped++;
            } else {
              const pgId = await this.importProperty(property);
              this.logger.info(
                `Imported property ${property.id}, assigned ID: ${pgId}`
              );
              result.imported++;
            }
          } catch (err) {
            this.logger.error(`Error importing property ${property.id}`, err);
            result.errors++;
            result.errorIds.push(property.id);
          }

          processed++;
          if (processed % 10 === 0 || processed === properties.length) {
            this.logger.info(
              `Progress: ${processed}/${properties.length} (${Math.round(
                (processed / properties.length) * 100
              )}%)`
            );
          }
        }
      }
    } catch (err) {
      this.logger.error('Migration failed', err);
      throw err;
    } finally {
      // Close connections
      await this.mongoClient.close();
      this.logger.info('MongoDB connection closed');
      await this.logger.close();
    }

    return result;
  }
}

// CLI script
async function main() {
  // When running in NX environment, it may use different environment file
  // Try to load .env.development or .env explicitly if not already loaded
  if (!process.env.MONGO_URI || !process.env.DATABASE_URL) {
    try {
      dotenv.config({ path: '.env.development' });
    } catch (e) {
      try {
        dotenv.config();
      } catch (e) {
        // Ignore if can't load .env files
      }
    }
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const config: Partial<MigrationConfig> = {};

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
    } else if (arg === '--collection' || arg === '-c') {
      config.mongoCollection = args[++i];
    } else if (arg === '--database' || arg === '-db') {
      config.mongoDatabase = args[++i];
    } else if (arg === '--limit') {
      config.limit = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Property Migration Script
Usage: bunx nx run migrations:migrate [options]

Options:
  --dry-run, -d          Run in dry-run mode (no actual imports)
  --batch-size, -b N     Process properties in batches of N (default: 50)
  --log-level, -l LEVEL  Set log level (debug|info|warn|error) (default: info)
  --no-log-file          Don't write logs to file
  --log-dir PATH         Path to log directory (default: ./logs)
  --collection, -c NAME  MongoDB collection name (default: properties)
  --database, -db NAME   MongoDB database name (from connection string if not provided)
  --limit N              Limit the number of properties to process
  --help, -h             Show this help message

NX Configurations:
  bunx nx run migrations:migrate                   Run with default settings
  bunx nx run migrations:migrate:dry-run           Run in dry-run mode
  bunx nx run migrations:migrate:debug             Run with debug log level
  bunx nx run migrations:migrate -- --limit 10     Limit to 10 properties
      `);
      process.exit(0);
    }
  }

  // Run migration
  const migration = new PropertyMigration(config);
  const result = await migration.run();

  console.log('\nMigration completed:');
  console.log(`- Properties imported: ${result.imported}`);
  console.log(`- Properties skipped (already exist): ${result.skipped}`);
  console.log(`- Errors encountered: ${result.errors}`);
  if (result.errors > 0) {
    console.log(`- Properties with errors: ${result.errorIds.join(', ')}`);
  }
}

// Run the main function
// Check if this file is being run directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

// Export the migration class for programmatic usage
export { PropertyMigration, type MigrationConfig, type ImportResult };
