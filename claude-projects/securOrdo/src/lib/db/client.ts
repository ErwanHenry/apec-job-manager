import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Create the PostgreSQL connection pool
 * This uses the postgres library with connection pooling
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 20, // Maximum number of connections in the pool
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 10, // Timeout for establishing connection
});

/**
 * Create the Drizzle ORM instance with schema
 * This provides type-safe database access with full TypeScript support
 */
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

/**
 * Export the raw client for migrations and advanced operations
 */
export { client };

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await client.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await client.end();
  process.exit(0);
});
