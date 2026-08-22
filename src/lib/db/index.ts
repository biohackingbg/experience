import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Database access. `server-only` above is the guardrail: if this module is ever
 * imported from a Client Component, the build fails instead of shipping the
 * connection string to the browser.
 *
 * Only ever reached from Server Components, Server Actions and Route Handlers.
 */

type Client = ReturnType<typeof postgres>;
type Database = ReturnType<typeof drizzle<typeof schema>>;

// Dev hot-reload re-evaluates modules; without this cache every reload would
// open another pool and exhaust the database's connection limit.
const globalForDb = globalThis as unknown as {
  __bhClient?: Client;
  __bhDb?: Database;
};

function connect(): { client: Client; db: Database } {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or point it at a Neon dev branch.",
    );
  }

  const client = postgres(url, {
    // Serverless: each instance handles one request at a time, so a single
    // connection per instance is the right shape.
    max: 1,
    // Neon's pooled endpoint runs PgBouncer in transaction mode, which does
    // not support prepared statements.
    prepare: false,
  });

  return { client, db: drizzle(client, { schema }) };
}

/**
 * Lazily opens the connection so importing this module never fails at build
 * time - only an actual query requires DATABASE_URL to be present.
 */
export function getDb(): Database {
  if (globalForDb.__bhDb) return globalForDb.__bhDb;

  const { client, db } = connect();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__bhClient = client;
    globalForDb.__bhDb = db;
  }

  return db;
}

export { schema };
