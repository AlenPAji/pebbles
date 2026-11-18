# Product variant release

## Phase results from 18–19 November 2026

| Phase | Files and behaviour | Verification |
| --- | --- | --- |
| 1. Database | `server/db/schema.ts`, `drizzle/0008_colour_inventory.sql`, `drizzle/meta/0008_snapshot.json`, appended journal entry, `scripts/variant-audit.sql`, `scripts/rehearse-variants.cjs` | The verified Neon development branch had zero audit findings. A rollback rehearsal compared all original columns for 9 products, 13 variants, 7 images and 2 users. Order, address and payment tables were empty. The persistent development upgrade then matched each prior migration hash and recorded entry 9. |
| 2. Repositories and validation | `server/db/transaction.ts`, `server/repositories/inventory.ts`, `server/repositories/product.repository.ts`, `server/validators/catalog.ts`, `server/validators/checkout.ts` | TypeScript passed. Real Neon transactions exercised deterministic row locking, reservation visibility and atomic rollback. |
| 3. Product management | `server/repositories/catalog-write.ts`, `server/services/catalog-form.ts`, `app/api/admin/products/` collection, detail, variants and stock-out routes, `app/components/ProductForm.tsx`, admin create/edit pages | Development integration tests retained legacy IDs and a private object key, created colour-specific stock and galleries, preserved image IDs on reorder, and rejected stale or cross-gallery edits. |
| 4. Storefront and payments | `app/components/store.tsx`, `app/lib/catalog-selection.ts`, `app/lib/cart.ts`, `app/lib/use-cart.ts`, product detail, cart, checkout and order pages, cart quote, create-order, retry, verify-payment, Razorpay webhook and admin order routes, `server/repositories/checkout.ts`, `server/services/razorpay.ts` | Two competing checkouts for the last unit produced one reservation. Concurrent confirmations consumed both lines once. A legacy multi-line retry retained original sale prices. A late capture produced a single review. |
| 5. Verification | `tests/cart-checkout.test.ts`, existing category and inventory suites, `integration/variants.neon.ts`, `integration/storefront-smoke.cjs`, `package.json` | 18 unit tests and 8 Neon integration scenarios passed. The Next.js production build passed. The running build served the product listing and colour selector and returned matching cart prices for two development variants. |

Production deployment awaits approval. Hosted GoDaddy WebSocket connectivity, a signed-in admin image upload, and a full Razorpay test-mode browser checkout with a delivered webhook still require staging verification. The local development configuration had no `RAZORPAY_WEBHOOK_SECRET` at verification time.

## Migration and compatibility

The upgrade starts at migration 0007. Review [the complete migration](drizzle/0008_colour_inventory.sql) and [the audit queries](scripts/variant-audit.sql). The audit identifies affected IDs and blocks the migration on duplicate normalized variant SKUs and sizes, invalid stock or catalogue values, empty object keys and orders with multiple successful payments. Its second result set flags historical items and orders for investigation.

Migration 0008 adds one default colour per existing product, including archived products. It attaches the original variant and image rows to that colour before enforcing ownership and uniqueness. Composite foreign keys tie images and variants to their product and order lines to their product and variant. Image positions and active sizes are unique within a colour. Variant SKUs remain globally unique across archived and active rows. Existing product, variant and image IDs, image keys, stock quantities and sale snapshots are preserved. No S3 operation is part of the migration.

Existing order snapshots stay intact. New lines store the chosen variant ID, colour, size, SKU and sale price. On a payment retry for an earlier pending order, the app can add a missing reference when the original product, size and SKU match exactly one active variant. An ambiguous line, changed order total or missing match sends the customer to the shop for assistance. An already captured legacy payment with no reliable reservation enters the review queue.

## Development verification

Use the endpoint of a separately identified Neon development branch. The rehearsal checks that the connection hostname matches the argument. It can read the connection privately from `PEBBLES_DEV_DATABASE_URL` or the local `.env.local` file.

```powershell
$env:PEBBLES_VERIFIED_DEV_HOST = '<verified development endpoint hostname>'
node scripts/rehearse-variants.cjs $env:PEBBLES_VERIFIED_DEV_HOST --audit
# Rehearse on an unmigrated branch. Compare every original column, then roll back.
node scripts/rehearse-variants.cjs $env:PEBBLES_VERIFIED_DEV_HOST
npm test
npm run test:neon
npm run build
# For a persistent development upgrade, check all migration hashes and apply using Drizzle.
node scripts/rehearse-variants.cjs $env:PEBBLES_VERIFIED_DEV_HOST --apply-dev
node integration/storefront-smoke.cjs
```

The integration tests create a uniquely named scratch schema on that endpoint and build representative legacy data there. They exercise the actual transaction-capable catalogue and order repositories through Neon. Razorpay responses are simulated and no test charge is made.

## Application and hosting

- Catalogue reads use the Neon HTTP driver. Checkout, catalogue writes and payment confirmation use a small Neon WebSocket pool. Each transaction uses one connection. All inventory writers lock variant rows in UUID order, then read committed reservations in a fresh statement. Verify outbound WebSocket connectivity from the intended Node host. This implementation was tested on Node 22. [Neon driver documentation](https://neon.com/docs/serverless/serverless-driver)
- A reservation holds the requested quantities for **15 minutes**. Available stock excludes active holds. Expiration releases availability according to database time, including when no worker is running. An eligible retry renews all lines together. A verified capture consumes the holds and decrements every line in one transaction. A repeated payment notification returns its existing result.
- Configure the Razorpay `payment.captured` webhook at `/api/webhooks/razorpay` and set the matching `RAZORPAY_WEBHOOK_SECRET` in the host's Secrets panel. This is a separate secret from the Razorpay API key. An authorized payment awaiting capture stays pending. Run a test-mode checkout on the staged host and check delivery of the signed webhook, including when the browser closes before returning. [Razorpay webhook verification](https://razorpay.com/docs/webhooks/validate-test/)
- Use the existing private bucket. New galleries reference distinct object keys. Gallery edits archive metadata and retain stored objects. An interrupted upload or failed product save can leave newly uploaded objects without a database reference. Check both active and archived image records before any later storage cleanup.
- Captures with expired reservations or conflicting local state are recorded in `payment_reviews` and shown on the order detail pages. Check the provider payment ID, available stock and captured amount with Razorpay before resolving fulfilment or a refund. The application does not issue an automatic refund.

## Production handover

1. Review development results and obtain approval for production. Use a current branch copy to run the audit and rehearse against the latest data. Resolve duplicate identities with the catalogue owner.
2. Plan a coordinated cutover and a recovery point. Pause catalogue writes and checkout on all instances, allow active payments to finish, and record any open payments for reconciliation. The old editor replaces variant rows and is incompatible with the migrated catalogue.
3. During the approved cutover, apply the committed Drizzle migration and start the matching application release. The migration obtains table locks and times out if they cannot be acquired. Run the storefront, admin, gallery, checkout, payment-retry and webhook smoke checks before reopening writes.
4. A migration error rolls back its transaction. If the application fails after migration, pause writes and repair or redeploy a variant-aware version. Before using a database recovery point, reconcile any payments and writes received since that point.
