import type { Config } from "drizzle-kit";

/**
 * Migrations are generated from the schema and committed to git, then applied
 * deliberately - never auto-pushed to a database holding real signups.
 */
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
} satisfies Config;
