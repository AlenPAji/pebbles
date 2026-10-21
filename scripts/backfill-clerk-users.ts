import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

config({ path: ".env.local" });

async function backfillUsers() {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const schema = await import("../server/db/schema");
  const usersTable = schema.users;
  const databaseUrl = process.env.Postgres_URL;
  if (!databaseUrl) throw new Error("Missing Postgres_URL environment variable");

  const db = drizzle(neon(databaseUrl));
  const client = await clerkClient();
  let offset = 0;
  const limit = 100;
  let synced = 0;

  while (true) {
    const users = await client.users.getUserList({ limit, offset });

    for (const user of users.data) {
      const primaryEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress ?? null;
      const name = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || user.username || null;

      const [existingByEmail] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, primaryEmail ?? ""))
        .limit(1);

      if (existingByEmail && primaryEmail) {
        await db
          .update(usersTable)
          .set({
            externalUserId: user.id,
            name,
            email: primaryEmail,
            deletedAt: null,
            updatedAt: new Date()
          })
          .where(eq(usersTable.id, existingByEmail.id));
        synced += 1;
        continue;
      }

      await db
        .insert(usersTable)
        .values({ externalUserId: user.id, name, email: primaryEmail })
        .onConflictDoUpdate({
          target: usersTable.externalUserId,
          set: { name, email: primaryEmail, deletedAt: null, updatedAt: new Date() }
        });
      synced += 1;
    }

    if (users.data.length < limit) break;
    offset += limit;
  }

  console.log(`Backfilled ${synced} Clerk user profile(s).`);
}

backfillUsers().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Clerk user profile backfill failed: ${message}`);
  process.exitCode = 1;
});
