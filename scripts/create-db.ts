import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function createDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  await client.connect();

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error('DB_NAME is required');
  }

  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  } else {
    console.log(`Database "${dbName}" already exists. Skipping.`);
  }

  await client.end();
}

createDatabase().catch((error: Error) => {
  console.error('Failed to create database:', error.message || String(error));
  process.exit(1);
});
