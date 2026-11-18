-- Fresh-database bootstrap for this release. Run using psql, not the SQL Editor.
-- Uses only the migration files in this checkout; no other database is read.
-- Generated from drizzle/meta/_journal.json. Includes migrations 0000 through 0007.
-- Refuses existing public tables or Drizzle migration history.
\set ON_ERROR_STOP on

BEGIN;
SET LOCAL search_path TO public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p', 'v', 'm', 'f')
  ) OR to_regclass('drizzle.__drizzle_migrations') IS NOT NULL THEN
    RAISE EXCEPTION 'Bootstrap requires a fresh database with no public tables or Drizzle migration history. Use npm run db:migrate for an existing application database.';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- 0000_spotty_jack_flag
\ir ../drizzle/0000_spotty_jack_flag.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('b8a598aba735544a3e9143042c141c53f5570c370e32b3505c38664e6ed66e98', 1792611553988);

-- 0001_groovy_the_initiative
\ir ../drizzle/0001_groovy_the_initiative.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0d29623b7696ba5a0ea9239e6b1754ea217082c976823b373f1b1bbe0f46cddd', 1792611597570);

-- 0002_stormy_colossus
\ir ../drizzle/0002_stormy_colossus.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('7bf1e5e437994ab2504d95d8f5a7c37630213c5e9e31f4cc3f53dc83bd929fee', 1792612590078);

-- 0003_product_variants
\ir ../drizzle/0003_product_variants.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('73f9c785830e73e015a72f616128d371ef91130cf0a09d1c752c062200b89213', 1792613000000);

-- 0004_order_item_size
\ir ../drizzle/0004_order_item_size.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('eb7c4c0343341fd02f198ebeb89cb9e2c0353f9085bbb4a71ec9306a712c3b20', 1792614000000);

-- 0005_next_senator_kelly
\ir ../drizzle/0005_next_senator_kelly.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('a0b92bea97ece2a52fe5e810bd5e14e486e156b437f949a969d0885fc794f9ec', 1794242399919);

-- 0006_panoramic_frog_thor
\ir ../drizzle/0006_panoramic_frog_thor.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('d2e94d8f4019a7d9a2d6b06be9e24cc2206225d8f16ad6123e9e4ca7134daf61', 1794290986165);

-- 0007_lying_photon
\ir ../drizzle/0007_lying_photon.sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('9071bbc93338de3dd969a75eca461ccb3f5a34f667a65d4c7c27dfaf25d4e48c', 1794598247476);

COMMIT;

SELECT current_database() AS database, count(*) AS products
FROM public.products WHERE deleted_at IS NULL;

\echo Fresh schema created successfully. All 8 migrations are recorded.
