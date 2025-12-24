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

export async function DB_Update( table, data, id, idCol = 'id' ) {
  if (!table || !data || typeof data !== 'object') {
    throw new Error('Invalid parameters for DB_Update');
  }

  const setFragments = Object.entries(data).map(
    ([col, value]) =>
      sql`${sql.identifier(col)} = ${value}`
  );

  const query = sql`
    UPDATE ${sql.identifier(table)}
    SET ${sql.join(setFragments, sql`, `)}
    WHERE ${sql.identifier(idCol)} = ${id}
    RETURNING *
  `;

  const result = await DB.execute(query);
  return result.rows?.[0] ?? null;
}

export async function DB_Fetch(query) {
  return (await DB.execute(typeof(query) === 'object' ? sql`${query}` : query)).rows;
}

export async function DB_Init() {
  return DB.execute("BEGIN");
}

export async function DB_Commit() {
  return DB.execute("COMMIT");
}

export async function DB_Rollback() {
  return DB.execute("ROLLBACK");
}
