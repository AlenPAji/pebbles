# TODO — Clerk + Neon user profiles

**First milestone:** When a person signs up with Clerk, create a corresponding record in Neon PostgreSQL's `users` table. Clerk handles authentication; Neon stores your app's profile data.

## 1. Set up the `users` table
- [x] Create a `users` table as mentioned in the db_schema.md
- [x] Use a separate internal UUID primary key and a unique Clerk ID in `external_user_id`.
- [x] Do **not** store passwords, session tokens, or Clerk secret keys in Neon.

## 2. Keep database code on the server
- [x] Put connection and queries in the server-side `server/db/` and `server/repositories/` directories used by this app.
- [x] Use Drizzle ORM and track schema changes with migrations in `drizzle/`.

## 3. Automatically sync Clerk signup
- [x] Configure a Clerk webhook for `user.created`, `user.updated`, and `user.deleted`.
- [x] Add `app/api/webhooks/clerk/route.ts`.
- [x] Verify the webhook signature using the signing secret **before** processing data. The endpoint is public to Clerk and does not require an interactive user session.
- [x] On `user.created`, extract Clerk user ID, primary email, first name, last name, and username and **upsert** into `users` using unique `external_user_id`.
- [x] On `user.updated`, update the corresponding fields and handle optional values.
- [x] Anonymize deleted users while retaining their internal row so related historical orders remain intact.
- [x] Handle webhook retries and duplicates through idempotent upserts; return retryable errors for processing failures and do not log secrets.
- [x] Backfill profiles for users who signed up before enabling webhooks with `npm run db:backfill-users`.
- [x] Implement server-side `ensureUserProfile()` using the verified Clerk identity when a profile is needed immediately.

## 4. Read user profiles safely
- [x] In a Server Component, Server Action, or Route Handler, call Clerk's server-side `auth()` to obtain the verified `userId`.
- [x] Fetch the `users` row using that ID; never trust a browser-supplied user ID.
- [x] Keep database queries and business logic under `server/`; send only required fields to the frontend.
- [x] Check authentication at protected entry points. The database defaults profiles to `customer`; frontend data cannot assign admin/vendor roles.

## 5. Test the first feature
- [ ] New signup creates exactly one row.
- [ ] Signing in again does not create duplicates.
- [ ] Changing name/email in Clerk updates the profile.
- [ ] Invalid webhook signatures are rejected.
- [ ] Signed-out users cannot access protected profile data.
- [ ] Concurrent sync attempts still create only one row.
- [ ] Account deletion follows the chosen data policy.

## Suggested structure

```text
src/
  app/api/webhooks/clerk/route.ts
  server/
    db/index.ts
    repositories/user.repository.ts
    services/user.service.ts
```

**Flow:** Clerk signup → signed Clerk webhook → server verifies signature → upsert Neon `users` row → backend later reads it using Clerk's verified `userId`.
