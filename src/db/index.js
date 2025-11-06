import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export const DB = drizzle(connPool);

export {default as Tables } from '@/db/tables';

export async function DB_Insert(query, idCol = 'id') {
  let fullQuery = `${query}\nRETURNING ${idCol}`;

  if (typeof(query) === 'object') {
    fullQuery = sql`${query}\nRETURNING ${sql.identifier(idCol)}`;
  }

  const result = await DB.execute(fullQuery);

  if (result && result.rowCount > 0) {
    return result.rows[0][idCol];
  }

  return null;
}

export async function DB_Fetch(query) {
  return (await DB.execute(typeof(query) === 'object' ? sql`${query}` : query)).rows;
}
