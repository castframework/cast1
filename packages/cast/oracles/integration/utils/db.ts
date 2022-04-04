import { Client, ClientConfig } from 'pg';

export async function createDb(dbname: string): Promise<void> {
  const client = getClient('postgres');
  await client.connect();

  await client.query(`
        CREATE DATABASE ${dbname}
        WITH TEMPLATE init_data_3
    `);
  await client.end();
}

export async function deleteDb(dbname: string): Promise<void> {
  const client = getClient('postgres');
  await client.connect();

  await client.query(`DROP DATABASE ${dbname}`);
  await client.end();
}

function getClient(dbname: string): Client {
  return new Client({
    host: process.env['POSTGRES_HOST'],
    port: process.env['POSTGRES_PORT'],
    user: process.env['POSTGRES_USER'],
    password: process.env['POSTGRES_PASSWORD'],
    database: dbname,
    ssl: process.env['POSTGRES_SSL'] === 'true',
    // dirty hack to avoid cases when global.Promise === undefined
    Promise: Promise,
  } as unknown as ClientConfig);
}
