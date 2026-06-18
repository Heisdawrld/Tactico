/**
 * Tactico Database Client
 * Turso (libSQL) database connection and utilities
 */

import { createClient, Client, ResultSet } from '@libsql/client';

// Database configuration
const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

/**
 * Get or create database client
 */
export function getDbClient(): Client {
  if (!client) {
    client = createClient({
      url: dbUrl,
      authToken: authToken,
    });
  }
  return client;
}

/**
 * Execute a query
 */
export async function query<T = any>(
  sql: string,
  args?: any[]
): Promise<T[]> {
  const db = getDbClient();
  const result: ResultSet = await db.execute({ sql, args: args || [] });
  
  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  // Convert rows to objects with column names as keys
  return result.rows.map((row) => {
    const obj: any = {};
    for (let i = 0; i < row.length; i++) {
      const columnName = result.columns ? result.columns[i] : `column${i}`;
      obj[columnName] = row[i];
    }
    return obj as T;
  });
}

/**
 * Execute a single statement (INSERT, UPDATE, DELETE)
 */
export async function run(sql: string, args?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
  const db = getDbClient();
  const result: ResultSet = await db.execute({ sql, args: args || [] });
  
  return {
    changes: result.affectedRowCount || 0,
    lastInsertRowid: Number(result.lastInsertRowid || 0),
  };
}

/**
 * Execute multiple statements in a transaction
 */
export async function transaction<T>(
  fn: (db: Client) => Promise<T>
): Promise<T> {
  const db = getDbClient();
  
  try {
    await db.execute('BEGIN TRANSACTION');
    const result = await fn(db);
    await db.execute('COMMIT');
    return result;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

/**
 * Initialize database schema
 */
export async function initializeDatabase(): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  
  const schemaPath = path.join(__dirname, '../schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolons and execute each statement
  // Remove all comment lines first to avoid filtering out valid SQL statements
  const schemaWithoutComments = schema
    .split('\n')
    .filter((line: string) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = schemaWithoutComments
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  await transaction(async (db) => {
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
      }
    }
  });
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    client.close();
    client = null;
  }
}

// Export database object with all methods
export const db = {
  query,
  run,
  transaction,
  initializeDatabase,
  closeDatabase,
  getClient: getDbClient,
};

// Export client directly for advanced usage
export { getDbClient as getClient };

export default db;
