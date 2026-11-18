// Run only with the endpoint of a separately verified Neon development branch.
const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { parse } = require("dotenv");

const endpoint = process.argv[2];
const url = new URL(
  process.env.PEBBLES_DEV_DATABASE_URL ||
    parse(readFileSync(".env.local")).POSTGRES_URL,
);
if (
  !endpoint ||
  !endpoint.startsWith("ep-") ||
  !endpoint.endsWith(".neon.tech") ||
  url.hostname !== endpoint
) {
  throw new Error(
    "Supply the exact verified Neon development endpoint hostname",
  );
}
const read = (path) => readFileSync(path, "utf8");
const audit = read("scripts/variant-audit.sql");
const tables = [
  "products",
  "product_variants",
  "product_images",
  "orders",
  "order_items",
  "order_addresses",
  "payments",
  "users",
];
const snapshot = tables
  .map(
    (table) =>
      `CREATE TEMP TABLE before_${table} AS SELECT id, to_jsonb(t) AS original FROM public.${table} t;`,
  )
  .join("\n");
const verify = tables
  .map(
    (table) => `
  IF EXISTS (SELECT 1 FROM before_${table} b FULL JOIN public.${table} t USING (id)
    WHERE t.id IS NULL OR b.id IS NULL OR NOT (to_jsonb(t) @> b.original)) THEN
    RAISE EXCEPTION 'Existing rows changed in ${table}';
  END IF;`,
  )
  .join("\n");
const rehearsal = `BEGIN ISOLATION LEVEL REPEATABLE READ;
${snapshot}
${audit}
${read("drizzle/0008_colour_inventory.sql")}
DO $$ BEGIN
${verify}
  IF EXISTS (SELECT 1 FROM products p WHERE (SELECT count(*) FROM product_colors c WHERE c.product_id=p.id AND c.is_default) <> 1) THEN
    RAISE EXCEPTION 'Default colour backfill incomplete';
  END IF;
END $$;
ROLLBACK;`;
// The optional development apply uses the same Drizzle migrator and journal as the app.
async function applyDevelopment() {
  const { Pool } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-serverless");
  const { migrate } = require("drizzle-orm/neon-serverless/migrator");
  const { createHash } = require("node:crypto");
  const pool = new Pool({
    connectionString: url.href,
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  try {
    const { rows } = await pool.query(
      "select created_at, hash from drizzle.__drizzle_migrations order by created_at",
    );
    const journal = JSON.parse(read("drizzle/meta/_journal.json")).entries;
    if (
      journal.length !== 9 ||
      journal[8].tag !== "0008_colour_inventory" ||
      ![8, 9].includes(rows.length)
    )
      throw new Error(
        "Unexpected migration history; review this development branch",
      );
    rows.forEach((row, i) => {
      const source = read("drizzle/" + journal[i].tag + ".sql").replace(
        /\r\n/g,
        "\n",
      );
      const hashes = [source, source.replace(/\n/g, "\r\n")].map((text) =>
        createHash("sha256").update(text).digest("hex"),
      );
      if (
        Number(row.created_at) !== journal[i].when ||
        !hashes.includes(row.hash)
      )
        throw new Error("History mismatch at " + journal[i].tag);
    });
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
    const result = await pool.query(
      "select count(*)::int as count from drizzle.__drizzle_migrations",
    );
    if (result.rows[0].count !== 9)
      throw new Error("Migration journal verification failed");
    console.log("Verified development migration 0008. Journal entries: 9.");
  } finally {
    await pool.end();
  }
}
if (process.argv[3] === "--apply-dev") {
  applyDevelopment().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
} else {
  const sql = process.argv[3] === "--audit" ? audit : rehearsal;
  const result = spawnSync(
    "psql",
    ["-X", "-v", "ON_ERROR_STOP=1", "-P", "pager=off"],
    {
      input: sql,
      encoding: "utf8",
      env: {
        ...process.env,
        PGHOST: endpoint,
        PGPORT: url.port || "5432",
        PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
        PGUSER: decodeURIComponent(url.username),
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: "require",
        PGCONNECT_TIMEOUT: "12",
      },
    },
  );
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || result.error?.message || "");
  process.exitCode = result.status ?? 1;
}
