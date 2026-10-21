import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.Postgres_URL;

if (!databaseUrl) {
  throw new Error("Missing Postgres_URL environment variable");
}

export const db = drizzle(neon(databaseUrl));
