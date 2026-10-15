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
 *
 * The client is kept for the life of the process in production too. It used
 * to be kept only in development, so on Vercel every getDb() call - and a
 * request makes several - opened a fresh connection: a TLS handshake and a
 * login to Neon each time, which was most of the API's response time.
 * postgres-js reconnects by itself if the pooler drops the socket.
 */
export function getDb(): Database {
  if (globalForDb.__bhDb) return globalForDb.__bhDb;

  const { client, db } = connect();
  globalForDb.__bhClient = client;
  globalForDb.__bhDb = db;
  return db;
}

export { schema };
