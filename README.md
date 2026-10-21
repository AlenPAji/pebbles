# Pebbles

## Development

```bash
npm install
npm run dev
```

## Clerk setup

1. Create a Clerk application.
2. Copy `.env.example` to `.env.local`.
3. Replace the placeholders with the keys from Clerk:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: the browser-safe publishable key.
   - `CLERK_SECRET_KEY`: the server-only secret key.
   - `CLERK_WEBHOOK_SIGNING_SECRET`: the signing secret from the Clerk webhook endpoint.
5. Keep the Neon connection string under the exact name `Postgres_URL`.
6. Restart the development server.

Clerk is registered in the root layout and request middleware. Protected server
entry points must still call `auth()` (or the `requireUser` helper) themselves.
The example endpoint at `/api/example` returns `401` when there is no signed-in
Clerk session.

## Neon database and Clerk webhooks

The database schema is defined in `server/db/schema.ts` and managed with
Drizzle. Generate and apply migrations with:

```bash
npm run db:generate
npm run db:migrate
npm run db:backfill-users
```

Configure Clerk to send `user.created`, `user.updated`, and `user.deleted`
events to `/api/webhooks/clerk`. The endpoint verifies the Svix signature
before processing. Deleted Clerk users are anonymized in Neon so historical
orders remain intact. Run the backfill command once after enabling the webhook
to synchronize users who already existed in Clerk.

The protected `/api/profile` route uses Clerk's verified server identity and
creates the profile on demand if webhook delivery is delayed.

## Product CRUD and Neon Object Storage

Vendor product management is available at `/admin/products`. The create,
edit, list, and delete operations are protected by the server-side vendor
check. Product images are uploaded to the Neon Object Storage bucket named
`products`; the corresponding `product_images.sort_order` is preserved from
the order selected in the upload control.

Neon Object Storage credentials use these environment variables:

```dotenv
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT_URL_S3=...
AWS_REGION=...
```

Create a Neon storage credential with read/write access and copy these values
from Neon into `.env.local`. The bucket must be named `products`.

## Vendor access

Profiles are created with the `customer` role by default. To grant a trusted
user access to the vendor dashboard, update their role in Neon using their
Clerk user ID:

```sql
UPDATE users
SET role = 'vendor', updated_at = now()
WHERE external_user_id = 'user_...';
```

Vendor access is checked on the server in `app/admin/layout.tsx`; changing
client-side navigation or hiding links cannot grant admin access.

The storefront remains publicly browsable. Adding products to the cart and
opening the cart do not require authentication. Selecting an Account link
starts Clerk sign-in when the visitor is signed out and opens the profile when
the visitor is signed in.
